"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  TrendingUp,
  Receipt,
  CreditCard,
  Calendar,
} from "lucide-react";

type SalesReport = {
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
  topProducts: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
  salesByPaymentMethod: {
    method: string;
    count: number;
    total: number;
  }[];
  dailySales: {
    date: string;
    transactions: number;
    revenue: number;
  }[];
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<SalesReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const generateReport = async () => {
    // Validate dates
    if (!startDate || !endDate) {
      toast.error("Silakan pilih tanggal mulai dan tanggal akhir");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      toast.error("Tanggal mulai harus sebelum atau sama dengan tanggal akhir");
      return;
    }

    setIsGenerating(true);
    setReport(null);

    try {
      const response = await fetch(
        `/api/reports/sales?start=${startDate}&end=${endDate}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal membuat laporan");
      }

      const data = await response.json();
      setReport(data);
      toast.success("Laporan berhasil dibuat");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal membuat laporan"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Silakan buat laporan terlebih dahulu");
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch(
        `/api/reports/sales?start=${startDate}&end=${endDate}&download=true`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengunduh laporan");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-penjualan-${startDate}-${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Laporan berhasil diunduh");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengunduh laporan"
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Laporan Penjualan</h1>
          <p className="text-muted-foreground">
            Generate dan unduh laporan penjualan dalam format Excel
          </p>
        </div>
        {report && (
          <Button
            onClick={downloadReport}
            disabled={isDownloading}
            className="w-full sm:w-auto"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {isDownloading ? "Mengunduh..." : "Unduh Excel"}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Generate Laporan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium block mb-2">
                Tanggal Mulai
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 w-full">
              <label className="text-sm font-medium block mb-2">
                Tanggal Akhir
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button
              onClick={generateReport}
              disabled={isGenerating}
              className="w-full sm:w-auto"
            >
              {isGenerating ? "Membuat..." : "Generate"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Penjualan
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">
                  {formatCurrency(report.totalSales)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Transaksi
                </CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">
                  {report.totalTransactions}
                </div>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Rata-rata Transaksi
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl md:text-2xl font-bold">
                  {formatCurrency(report.averageTransactionValue)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Top Products */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Produk Terlaris</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Rank</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-right">
                          Qty Terjual
                        </TableHead>
                        <TableHead className="text-right">Pendapatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.topProducts.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            #{index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {product.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.quantity}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(product.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Metode Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metode</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.salesByPaymentMethod.map((method, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium capitalize">
                            {method.method}
                          </TableCell>
                          <TableCell className="text-right">
                            {method.count}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(method.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Daily Sales */}
            <Card>
              <CardHeader>
                <CardTitle>Penjualan Harian</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-right">Transaksi</TableHead>
                        <TableHead className="text-right">Pendapatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.dailySales.map((day, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {new Date(day.date).toLocaleDateString("id-ID")}
                          </TableCell>
                          <TableCell className="text-right">
                            {day.transactions}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(day.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
