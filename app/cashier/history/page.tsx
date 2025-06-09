"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

type Transaction = {
  id: number;
  total_price: number;
  payment_method: string;
  transaction_date: string;
  details: {
    id: number;
    product: {
      name: string;
    };
    quantity: number;
    subtotal: number;
  }[];
};

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const url = dateFilter
          ? `/api/transactions?date=${dateFilter}`
          : "/api/transactions";
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch transactions");
        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        toast.error("Failed to fetch transactions");
      }
    };
    fetchTransactions();
  }, [dateFilter, setTransactions]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <div className="flex items-center space-x-4">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      <div className="space-y-6">
        {transactions.map((transaction) => (
          <Card key={transaction.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Transaction #{transaction.id}</CardTitle>
                  <p className="text-sm text-gray-500">
                    {format(
                      new Date(transaction.transaction_date),
                      "MMM d, yyyy HH:mm"
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {formatCurrency(transaction.total_price)}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    {transaction.payment_method}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaction.details.map((detail) => (
                    <TableRow key={detail.id}>
                      <TableCell>{detail.product.name}</TableCell>
                      <TableCell>{detail.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(detail.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
