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
import { format } from "date-fns";
import { toast } from "sonner";
import { Eye } from "lucide-react";
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
        error instanceof Error ? error.message : "Failed to fetch transactions"
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
      setTransactionDetails(data.details || []); // Ensure it's an array, even if empty
      setIsOpen(true);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to fetch transaction details"
      );
      setTransactionDetails([]); // Set to empty array in case of error
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading transactions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">All Transactions</h1>
        <div className="flex items-center space-x-4">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-auto"
          />
          {dateFilter && (
            <Button variant="outline" onClick={() => setDateFilter("")}>
              Clear Filter
            </Button>
          )}
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-10">No transactions found.</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(
                      new Date(transaction.transaction_date),
                      "MMM d, yyyy HH:mm"
                    )}
                  </TableCell>
                  <TableCell>{transaction.user.username}</TableCell>
                  <TableCell className="capitalize">
                    {transaction.payment_method}
                  </TableCell>
                  <TableCell>
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {format(
                      new Date(selectedTransaction.transaction_date),
                      "MMM d, yyyy HH:mm"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cashier</p>
                  <p className="font-medium">
                    {selectedTransaction.user.username}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium capitalize">
                    {selectedTransaction.payment_method}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-medium">
                    {formatCurrency(selectedTransaction.total_price)}
                  </p>
                </div>
              </div>

              {transactionDetails.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionDetails.map((detail) => (
                      <TableRow key={detail.id}>
                        <TableCell>{detail.product.name}</TableCell>
                        <TableCell>{detail.quantity}</TableCell>
                        <TableCell>{formatCurrency(detail.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p>No details available for this transaction.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
