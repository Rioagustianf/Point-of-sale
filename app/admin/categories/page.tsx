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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Tag, Package } from "lucide-react";
import { cn } from "@/lib/utils";

type Category = {
  id: number;
  name: string;
  _count: {
    products: number;
  };
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error("Failed to save category");

      toast.success(
        `Kategori berhasil ${editingCategory ? "diperbarui" : "ditambahkan"}`
      );
      setIsOpen(false);
      setName("");
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      toast.error("Gagal menyimpan kategori");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setIsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kategori ini?")) return;

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete category");

      toast.success("Kategori berhasil dihapus");
      fetchCategories();
    } catch (error) {
      toast.error("Gagal menghapus kategori");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 bg-blue-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Tag className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            Manajemen Kategori
          </h1>
          <p className="text-slate-600">
            Kelola kategori produk untuk sistem POS Anda
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingCategory(null);
                setName("");
              }}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kategori
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-800">
                {editingCategory ? "Edit Kategori" : "Tambah Kategori"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-slate-700"
                >
                  Nama Kategori
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama kategori"
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {editingCategory ? "Perbarui" : "Tambah"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-white shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Kategori
            </CardTitle>
            <Tag className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {categories.length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Produk
            </CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {categories.reduce((sum, cat) => sum + cat._count.products, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <Card className="bg-white shadow-md border-0 mt-6">
        <CardHeader>
          <CardTitle className="text-slate-800">Daftar Kategori</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-600 hover:bg-blue-700">
                  <TableHead className="font-semibold text-white border-b border-blue-200">
                    Kategori
                  </TableHead>
                  <TableHead className="font-semibold text-white border-b border-blue-200">
                    Jumlah Produk
                  </TableHead>
                  <TableHead className="font-semibold text-white border-b border-blue-200 w-[120px]">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-8 text-slate-500"
                    >
                      Belum ada kategori. Tambahkan kategori pertama Anda!
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category, idx) => (
                    <TableRow
                      key={category.id}
                      className={cn(
                        "transition-colors border-b border-blue-100",
                        idx % 2 === 0 ? "bg-blue-50" : "bg-white",
                        "hover:bg-blue-100/80"
                      )}
                    >
                      <TableCell className="font-medium text-slate-800">
                        {category.name}
                      </TableCell>
                      <TableCell>
                        <Badge className="border-blue-600 text-blue-700 bg-blue-100 font-semibold shadow-sm">
                          {category._count.products}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(category)}
                            className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-100"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category.id)}
                            className="h-8 w-8 text-slate-600 hover:text-red-600 hover:bg-red-100"
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
