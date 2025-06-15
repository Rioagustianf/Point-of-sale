"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Receipt } from "lucide-react";

interface TransactionChartProps {
  data: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
}

export function TransactionChart({ data }: TransactionChartProps) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Receipt className="h-5 w-5" />
            Jumlah Transaksi Harian
          </CardTitle>
          <CardDescription className="text-purple-600">
            Grafik jumlah transaksi dalam 30 hari terakhir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-purple-500">
            Tidak ada data tersedia
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("id-ID", {
      month: "short",
      day: "numeric",
    }),
    transactions: item.transactions,
  }));

  return (
    <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Receipt className="h-5 w-5" />
          Jumlah Transaksi Harian
        </CardTitle>
        <CardDescription className="text-purple-600">
          Grafik jumlah transaksi dalam 30 hari terakhir ({data.length} hari)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            transactions: {
              label: "Transaksi",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[300px]"
        >
          <BarChart data={chartData}>
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [value, "Transaksi"]}
                />
              }
            />
            <Bar dataKey="transactions" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
