import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";
import * as XLSX from "xlsx";

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

    const [
      totalSales,
      totalTransactions,
      topProducts,
      salesByPaymentMethod,
      dailySales,
      detailedTransactions,
    ] = await Promise.all([
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
          take: 10,
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
            name: products.find((p) => p.id === result.product_id)?.name || "",
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

      // Daily sales
      prisma.transaction
        .groupBy({
          by: ["transaction_date"],
          where: {
            transaction_date: dateRange,
          },
          _count: true,
          _sum: {
            total_price: true,
          },
          orderBy: {
            transaction_date: "asc",
          },
        })
        .then((results) =>
          results.map((result) => ({
            date: result.transaction_date.toISOString().split("T")[0],
            transactions: result._count,
            revenue: Number(result._sum.total_price) || 0,
          }))
        ),

      // Detailed transactions for Excel
      prisma.transaction.findMany({
        where: {
          transaction_date: dateRange,
        },
        include: {
          user: {
            select: {
              username: true,
            },
          },
          details: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          transaction_date: "desc",
        },
      }),
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
      dailySales,
      detailedTransactions,
    };

    // If download is requested, generate Excel
    if (download) {
      const excelBuffer = generateReportExcel(reportData, startDate, endDate);
      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=sales-report-${startDate}-${endDate}.xlsx`,
        },
      });
    }

    // Otherwise, return JSON (without detailed transactions to reduce payload)
    const { detailedTransactions: _, ...jsonData } = reportData;
    return NextResponse.json(jsonData);
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

function generateReportExcel(
  reportData: any,
  startDate: string,
  endDate: string
): Buffer {
  const workbook = XLSX.utils.book_new();

  // Helper untuk style cell header
  function styleHeader(sheet: XLSX.WorkSheet, range: string) {
    const cellRange = XLSX.utils.decode_range(range);
    for (let C = cellRange.s.c; C <= cellRange.e.c; ++C) {
      const cell = sheet[XLSX.utils.encode_cell({ r: cellRange.s.r, c: C })];
      if (cell) {
        cell.s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4F81BD" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      }
    }
  }

  // Summary Sheet
  const summaryData = [
    ["LAPORAN PENJUALAN"],
    [""],
    ["Periode", `${startDate} s/d ${endDate}`],
    ["Tanggal Generate", new Date().toLocaleDateString("id-ID")],
    [""],
    ["RINGKASAN"],
    ["Total Penjualan", reportData.totalSales],
    ["Total Transaksi", reportData.totalTransactions],
    ["Rata-rata per Transaksi", reportData.averageTransactionValue],
    [""],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet["!cols"] = [{ width: 25 }, { width: 30 }];
  // Bold untuk judul
  summarySheet["A1"].s = {
    font: { bold: true, sz: 16 },
    alignment: { horizontal: "center" },
  };

  // Top Products Sheet
  const topProductsData = [
    ["PRODUK TERLARIS"],
    [""],
    ["Ranking", "Nama Produk", "Qty Terjual", "Total Pendapatan"],
  ];
  reportData.topProducts.forEach((product: any, index: number) => {
    topProductsData.push([
      index + 1,
      product.name,
      product.quantity,
      product.revenue,
    ]);
  });
  const topProductsSheet = XLSX.utils.aoa_to_sheet(topProductsData);
  topProductsSheet["!cols"] = [
    { width: 10 },
    { width: 30 },
    { width: 15 },
    { width: 20 },
  ];
  // Style header
  styleHeader(topProductsSheet, "A3:D3");

  // Payment Methods Sheet
  const paymentMethodsData = [
    ["PENJUALAN PER METODE PEMBAYARAN"],
    [""],
    ["Metode Pembayaran", "Jumlah Transaksi", "Total Nilai"],
  ];
  reportData.salesByPaymentMethod.forEach((method: any) => {
    paymentMethodsData.push([
      method.method.toUpperCase(),
      method.count,
      method.total,
    ]);
  });
  const paymentMethodsSheet = XLSX.utils.aoa_to_sheet(paymentMethodsData);
  paymentMethodsSheet["!cols"] = [{ width: 20 }, { width: 20 }, { width: 20 }];
  styleHeader(paymentMethodsSheet, "A3:C3");

  // Daily Sales Sheet
  const dailySalesData = [
    ["PENJUALAN HARIAN"],
    [""],
    ["Tanggal", "Jumlah Transaksi", "Total Penjualan"],
  ];
  reportData.dailySales.forEach((day: any) => {
    dailySalesData.push([day.date, day.transactions, day.revenue]);
  });
  const dailySalesSheet = XLSX.utils.aoa_to_sheet(dailySalesData);
  dailySalesSheet["!cols"] = [{ width: 15 }, { width: 20 }, { width: 20 }];
  styleHeader(dailySalesSheet, "A3:C3");

  // Detailed Transactions Sheet
  const transactionsData = [
    ["DETAIL TRANSAKSI"],
    [""],
    [
      "Tanggal",
      "ID Transaksi",
      "Kasir",
      "Metode Pembayaran",
      "Produk",
      "Qty",
      "Subtotal",
      "Total",
    ],
  ];
  reportData.detailedTransactions.forEach((transaction: any) => {
    transaction.details.forEach((detail: any, index: number) => {
      transactionsData.push([
        index === 0
          ? transaction.transaction_date.toLocaleDateString("id-ID")
          : "",
        index === 0 ? transaction.id : "",
        index === 0 ? transaction.user.username : "",
        index === 0 ? transaction.payment_method.toUpperCase() : "",
        detail.product.name,
        detail.quantity,
        detail.subtotal,
        index === 0 ? transaction.total_price : "",
      ]);
    });
    transactionsData.push(["", "", "", "", "", "", "", ""]);
  });
  const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
  transactionsSheet["!cols"] = [
    { width: 12 },
    { width: 12 },
    { width: 15 },
    { width: 18 },
    { width: 25 },
    { width: 8 },
    { width: 15 },
    { width: 15 },
  ];
  styleHeader(transactionsSheet, "A3:H3");

  // Tambahkan semua sheet ke workbook
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan");
  XLSX.utils.book_append_sheet(workbook, topProductsSheet, "Produk Terlaris");
  XLSX.utils.book_append_sheet(
    workbook,
    paymentMethodsSheet,
    "Metode Pembayaran"
  );
  XLSX.utils.book_append_sheet(workbook, dailySalesSheet, "Penjualan Harian");
  XLSX.utils.book_append_sheet(workbook, transactionsSheet, "Detail Transaksi");

  // Generate buffer
  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
    cellStyles: true,
  });
}
