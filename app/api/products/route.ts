import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";

export async function GET(request: Request) {
  const session = await validateRequest(request as any);

  if (!session || (session.role !== "admin" && session.role !== "kasir")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: { category: true },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await validateRequest(request as any);

  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const category_id = formData.get("category_id") as string;
    const price = formData.get("price") as string;
    const stock_quantity = formData.get("stock_quantity") as string;
    const photo = formData.get("photo") as File;

    if (!name || !category_id || !price || !stock_quantity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let photo_url = null;
    if (photo) {
      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filename = `${Date.now()}-${photo.name}`;
      const filepath = path.join(
        process.cwd(),
        "public",
        "uploads",
        "products",
        filename
      );
      await writeFile(filepath, buffer);
      photo_url = `/uploads/products/${filename}`;
    }

    const product = await prisma.product.create({
      data: {
        name,
        category: {
          connect: { id: Number.parseInt(category_id) },
        },
        price: Number.parseFloat(price),
        photo_url,
        stock_quantity: Number.parseInt(stock_quantity),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
