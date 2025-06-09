import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";
import { Parser } from "json2csv";

export async function GET(request: Request) {
  const session = await validateRequest(request as any);

  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");
    const download = searchParams.get("download") === "true";

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start and end dates are required" },
        { status: 400 }
      );
    }

    // Validate date input
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (start > end) {
      return NextResponse.json(
        { error: "Start date must be before or equal to end date" },
        { status: 400 }
      );
    }

    const dateRange = {
      gte: start,
      lte: new Date(end.setHours(23, 59, 59)),
    };

    const [totalSales, totalTransactions, topProducts, salesByPaymentMethod] =
      await Promise.all([
        // Total sales
        prisma.transaction.aggregate({
          where: {
            transaction_date: dateRange,
          },
          _sum: {
            total_price: true,
          },
        }),

        // Total transactions
        prisma.transaction.count({
          where: {
            transaction_date: dateRange,
          },
        }),

        // Top products
        prisma.transactionDetail
          .groupBy({
            by: ["product_id"],
            where: {
              transaction: {
                transaction_date: dateRange,
              },
            },
            _sum: {
              quantity: true,
              subtotal: true,
            },
            orderBy: {
              _sum: {
                subtotal: "desc",
              },
            },
            take: 5,
          })
          .then(async (results) => {
            const products = await prisma.product.findMany({
              where: {
                id: {
                  in: results.map((r) => r.product_id),
                },
              },
            });

            return results.map((result) => ({
              name:
                products.find((p) => p.id === result.product_id)?.name || "",
              quantity: result._sum.quantity || 0,
              revenue: Number(result._sum.subtotal) || 0,
            }));
          }),

        // Sales by payment method
        prisma.transaction
          .groupBy({
            by: ["payment_method"],
            where: {
              transaction_date: dateRange,
            },
            _count: true,
            _sum: {
              total_price: true,
            },
          })
          .then((results) =>
            results.map((result) => ({
              method: result.payment_method,
              count: result._count,
              total: Number(result._sum.total_price) || 0,
            }))
          ),
      ]);

    const reportData = {
      totalSales: Number(totalSales._sum.total_price) || 0,
      totalTransactions,
      averageTransactionValue:
        totalTransactions > 0
          ? (Number(totalSales._sum.total_price) || 0) / totalTransactions
          : 0,
      topProducts,
      salesByPaymentMethod,
    };

    // If download is requested, generate CSV
    if (download) {
      const csvData = generateReportCSV(reportData);
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename=sales-report-${startDate}-${endDate}.csv`,
        },
      });
    }

    // Otherwise, return JSON
    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

function generateReportCSV(
  reportData: any,
  startDate: string,
  endDate: string
): string {
  const csvRows: string[] = [];

  // Report Header
  csvRows.push('"Sales Report"');
  csvRows.push(`"Generated Date","${new Date().toLocaleDateString()}"`);
  csvRows.push(`"Report Period","${startDate} to ${endDate}"`);
  csvRows.push(""); // Empty line for spacing

  // Key Performance Indicators
  csvRows.push('"Key Performance Indicators"');
  csvRows.push('"Metric","Value"');
  csvRows.push(`"Total Sales","${reportData.totalSales.toFixed(2)}"`);
  csvRows.push(`"Total Transactions","${reportData.totalTransactions}"`);
  csvRows.push(
    `"Average Transaction Value","${reportData.averageTransactionValue.toFixed(
      2
    )}"`
  );
  csvRows.push(""); // Empty line for spacing

  // Top Products
  csvRows.push('"Top Products"');
  csvRows.push('"Rank","Product Name","Quantity Sold","Total Revenue"');
  reportData.topProducts.forEach((product, index) => {
    csvRows.push(
      `"${index + 1}","${product.name}","${
        product.quantity
      }","${product.revenue.toFixed(2)}"`
    );
  });
  csvRows.push(""); // Empty line for spacing

  // Sales by Payment Method
  csvRows.push('"Sales by Payment Method"');
  csvRows.push('"Payment Method","Transaction Count","Total Amount"');
  reportData.salesByPaymentMethod.forEach((method) => {
    csvRows.push(
      `"${method.method}","${method.count}","${method.total.toFixed(2)}"`
    );
  });

  return csvRows.join("\n");
}
