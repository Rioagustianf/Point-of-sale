import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await validateRequest(request as any);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    const where = {
      user_id: session.id,
      ...(date
        ? {
            transaction_date: {
              gte: new Date(date),
              lt: new Date(
                new Date(date).setDate(new Date(date).getDate() + 1)
              ),
            },
          }
        : {}),
    };

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        details: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
        receipt: true,
      },
      orderBy: {
        transaction_date: "desc",
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await validateRequest(request as any);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { items, payment_method, total_price } = await request.json();

    // Validate payment_method
    if (!["tunai", "kartu", "e_wallet"].includes(payment_method)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    const transaction = await prisma.$transaction(async (prisma) => {
      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          user_id: session.id,
          total_price,
          payment_method: payment_method as "tunai" | "kartu" | "e_wallet",
          details: {
            create: items.map((item: any) => ({
              product_id: item.id,
              quantity: item.quantity,
              subtotal: item.price * item.quantity,
            })),
          },
        },
        include: {
          details: true,
        },
      });

      // Update product stock and create inventory records
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.id },
          data: {
            stock_quantity: {
              decrement: item.quantity,
            },
          },
        });

        await prisma.inventory.create({
          data: {
            product_id: item.id,
            quantity_changed: -item.quantity,
            reason: "sale",
            transaction_id: transaction.id,
          },
        });
      }

      // Generate receipt number and create receipt
      const receipt = await prisma.receipt.create({
        data: {
          transaction_id: transaction.id,
          receipt_number: `INV-${transaction.id}-${Date.now()}`,
        },
      });

      return { ...transaction, receipt };
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Transaction error:", error);
    return NextResponse.json(
      { error: "Failed to process transaction" },
      { status: 500 }
    );
  }
}
