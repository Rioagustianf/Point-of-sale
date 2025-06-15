"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  Plus,
  Package,
  DollarSign,
  Archive,
} from "lucide-react";
import Image from "next/image";

type Product = {
  id: number;
  name: string;
  category: {
    id: number;
    name: string;
  };
  price: number;
  photo_url: string | null;
  stock_quantity: number;
};

type Category = {
  id: number;
  name: string;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    price: "",
    stock_quantity: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast.error("Gagal memuat produk");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toast.error("Gagal memuat kategori");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("category_id", formData.category_id);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("stock_quantity", formData.stock_quantity);
      if (photoFile) {
        formDataToSend.append("photo", photoFile);
      }

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (!response.ok) throw new Error("Failed to save product");

      toast.success(
        `Produk berhasil ${editingProduct ? "diperbarui" : "ditambahkan"}`
      );
      setIsOpen(false);
      setFormData({
        name: "",
        category_id: "",
        price: "",
        stock_quantity: "",
      });
      setPhotoFile(null);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error("Gagal menyimpan produk");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category.id.toString(),
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
    });
    setPhotoFile(null);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete product");

      toast.success("Produk berhasil dihapus");
      fetchProducts();
    } catch (error) {
      toast.error("Gagal menghapus produk");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  const totalValue = products.reduce(
    (sum, product) => sum + product.price * product.stock_quantity,
    0
  );
  const lowStockProducts = products.filter(
    (product) => product.stock_quantity < 10
  ).length;

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-green-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
            Manajemen Produk
          </h1>
          <p className="text-slate-600">
            Kelola inventori dan produk untuk sistem POS Anda
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingProduct(null);
                setFormData({
                  name: "",
                  category_id: "",
                  price: "",
                  stock_quantity: "",
                });
                setPhotoFile(null);
              }}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-slate-800">
                {editingProduct ? "Edit Produk" : "Tambah Produk"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium text-slate-700"
                  >
                    Nama Produk
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Masukkan nama produk"
                    className="border-slate-300 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="category"
                    className="text-sm font-medium text-slate-700"
                  >
                    Kategori
                  </label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category_id: value })
                    }
                    required
                  >
                    <SelectTrigger className="border-slate-300 focus:border-green-500 focus:ring-green-500">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="price"
                    className="text-sm font-medium text-slate-700"
                  >
                    Harga (Rp)
                  </label>
                  <Input
                    id="price"
                    type="number"
                    step="1000"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="0"
                    className="border-slate-300 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="stock_quantity"
                    className="text-sm font-medium text-slate-700"
                  >
                    Stok
                  </label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock_quantity: e.target.value,
                      })
                    }
                    placeholder="0"
                    className="border-slate-300 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label
                    htmlFor="photo"
                    className="text-sm font-medium text-slate-700"
                  >
                    Foto Produk
                  </label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    className="border-slate-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {editingProduct ? "Perbarui" : "Tambah"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Produk
            </CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {products.length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Nilai Inventori
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {formatCurrency(totalValue)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Stok Menipis
            </CardTitle>
            <Archive className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {lowStockProducts}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-800">Daftar Produk</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">
                    Produk
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Kategori
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Harga
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Stok
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">
                    Foto
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 w-[120px]">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-slate-500"
                    >
                      Belum ada produk. Tambahkan produk pertama Anda!
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium text-slate-800">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-blue-200 text-blue-700"
                        >
                          {product.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-green-700">
                        {formatCurrency(product.price)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.stock_quantity < 10
                              ? "destructive"
                              : "secondary"
                          }
                          className={
                            product.stock_quantity < 10
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }
                        >
                          {product.stock_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.photo_url ? (
                          <Image
                            width={48}
                            height={48}
                            src={product.photo_url || "/placeholder.svg"}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-slate-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                            className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                            className="h-8 w-8 text-slate-600 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
