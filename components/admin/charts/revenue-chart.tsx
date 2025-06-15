"use client";

import { Area, AreaChart, XAxis, YAxis } from "recharts";
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
import { TrendingUp } from "lucide-react";

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <TrendingUp className="h-5 w-5" />
            Pendapatan Harian
          </CardTitle>
          <CardDescription className="text-blue-600">
            Grafik pendapatan dalam 30 hari terakhir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-blue-500">
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
    revenue: item.revenue,
  }));

  return (
    <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <TrendingUp className="h-5 w-5" />
          Pendapatan Harian
        </CardTitle>
        <CardDescription className="text-blue-600">
          Grafik pendapatan dalam 30 hari terakhir ({data.length} hari)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            revenue: {
              label: "Pendapatan",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[300px]"
        >
          <AreaChart data={chartData}>
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [
                    new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(Number(value)),
                    "Pendapatan",
                  ]}
                />
              }
            />
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#blueGradient)"
              fillOpacity={0.6}
              stroke="#3b82f6"
              strokeWidth={3}
            />
            <defs>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
