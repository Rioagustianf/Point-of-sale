"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { Eye, Receipt, CreditCard, Calendar, Filter } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Transaction = {
  id: number;
  user: {
    username: string;
  };
  total_price: number;
  payment_method: string;
  transaction_date: string;
};

type TransactionDetail = {
  id: number;
  product: {
    name: string;
  };
  quantity: number;
  subtotal: number;
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<
    TransactionDetail[]
  >([]);
  const [isOpen, setIsOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = dateFilter
        ? `/api/transactions?date=${dateFilter}`
        : "/api/transactions";
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch transactions");
      }
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat transaksi"
      );
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const fetchTransactionDetails = async (id: number) => {
    try {
      const response = await fetch(`/api/transactions/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to fetch transaction details"
        );
      }
      const data = await response.json();
      setTransactionDetails(data.details || []);
      setIsOpen(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat detail transaksi"
      );
      setTransactionDetails([]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-600">
        <Receipt className="h-12 w-12 mb-4" />
        <p className="text-lg font-semibold">Error: {error}</p>
      </div>
    );
  }

  const totalRevenue = transactions.reduce(
    (sum, transaction) => sum + transaction.total_price,
    0
  );
  const todayTransactions = transactions.filter(
    (transaction) =>
      new Date(transaction.transaction_date).toDateString() ===
      new Date().toDateString()
  ).length;

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-purple-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
            Semua Transaksi
          </h1>
          <p className="text-slate-600">
            Monitor dan kelola semua transaksi penjualan
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 border-slate-300 focus:border-purple-500 focus:ring-purple-500"
              placeholder="Filter tanggal"
            />
          </div>
          {dateFilter && (
            <Button
              variant="outline"
              onClick={() => setDateFilter("")}
              className="border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Transaksi
            </CardTitle>
            <Receipt className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {transactions.length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Pendapatan
            </CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {formatCurrency(totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Transaksi Hari Ini
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {todayTransactions}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-800">Daftar Transaksi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">
                Tidak ada transaksi ditemukan
              </p>
              <p className="text-sm">
                Transaksi akan muncul di sini setelah ada penjualan
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">
                      Tanggal
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Kasir
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Metode Bayar
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Total
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 w-[100px]">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className="hover:bg-slate-50"
                    >
                      <TableCell className="font-medium text-slate-800">
                        {format(
                          new Date(transaction.transaction_date),
                          "dd MMM yyyy HH:mm"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-blue-200 text-blue-700"
                        >
                          {transaction.user.username}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${
                            transaction.payment_method === "tunai"
                              ? "bg-green-100 text-green-800"
                              : transaction.payment_method === "kartu"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {transaction.payment_method.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-green-700">
                        {formatCurrency(transaction.total_price)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            fetchTransactionDetails(transaction.id);
                          }}
                          className="h-8 w-8 text-slate-600 hover:text-purple-600 hover:bg-purple-50"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-800 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-purple-600" />
              Detail Transaksi
            </DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-slate-500 mb-1">Tanggal</p>
                    <p className="font-medium text-slate-800">
                      {format(
                        new Date(selectedTransaction.transaction_date),
                        "dd MMM yyyy HH:mm"
                      )}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-slate-500 mb-1">Kasir</p>
                    <p className="font-medium text-slate-800">
                      {selectedTransaction.user.username}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-slate-500 mb-1">Metode Bayar</p>
                    <p className="font-medium text-slate-800 capitalize">
                      {selectedTransaction.payment_method}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-slate-500 mb-1">Total</p>
                    <p className="font-bold text-green-700 text-lg">
                      {formatCurrency(selectedTransaction.total_price)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {transactionDetails.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-slate-800">
                      Item Pembelian
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="font-semibold text-slate-700">
                            Produk
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Qty
                          </TableHead>
                          <TableHead className="font-semibold text-slate-700">
                            Subtotal
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactionDetails.map((detail) => (
                          <TableRow key={detail.id}>
                            <TableCell className="font-medium text-slate-800">
                              {detail.product.name}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-800"
                              >
                                {detail.quantity}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-green-700">
                              {formatCurrency(detail.subtotal)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-center text-slate-500 py-8">
                  Tidak ada detail tersedia untuk transaksi ini.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
