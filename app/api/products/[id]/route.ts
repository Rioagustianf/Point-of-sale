import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { validateRequest } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await validateRequest(request as any);

  if (!session || (session.role !== "admin" && session.role !== "kasir")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: Number.parseInt(params.id) },
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const photo = formData.get("photo") as File | null;

    if (!name || !category_id || !price || !stock_quantity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let photo_url = undefined;
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

    const product = await prisma.product.update({
      where: { id: Number.parseInt(params.id) },
      data: {
        name,
        category: {
          connect: { id: Number.parseInt(category_id) },
        },
        price: Number.parseFloat(price),
        ...(photo_url && { photo_url }),
        stock_quantity: Number.parseInt(stock_quantity),
      },
      include: {
        category: true,
      },
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await validateRequest(request as any);

  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.product.delete({
      where: { id: Number.parseInt(params.id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
