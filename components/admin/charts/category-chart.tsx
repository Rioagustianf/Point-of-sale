"use client";

import { Cell, Pie, PieChart } from "recharts";
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
import { PieChartIcon } from "lucide-react";

interface CategoryChartProps {
  data: Array<{
    category_name: string;
    total_quantity: number;
    total_revenue: number;
  }>;
}

const COLORS = ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444"];

export function CategoryChart({ data }: CategoryChartProps) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-white to-emerald-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <PieChartIcon className="h-5 w-5" />
            Penjualan per Kategori
          </CardTitle>
          <CardDescription className="text-emerald-600">
            Distribusi pendapatan berdasarkan kategori produk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-emerald-500">
            Tidak ada data tersedia
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data
    .filter((item) => item.total_revenue > 0)
    .map((item, index) => ({
      name: item.category_name,
      value: item.total_revenue,
      quantity: item.total_quantity,
      fill: COLORS[index % COLORS.length],
    }));

  if (chartData.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-white to-emerald-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <PieChartIcon className="h-5 w-5" />
            Penjualan per Kategori
          </CardTitle>
          <CardDescription className="text-emerald-600">
            Distribusi pendapatan berdasarkan kategori produk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-emerald-500">
            Belum ada penjualan
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white to-emerald-50 border-emerald-200 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-800">
          <PieChartIcon className="h-5 w-5" />
          Penjualan per Kategori
        </CardTitle>
        <CardDescription className="text-emerald-600">
          Distribusi pendapatan berdasarkan kategori produk ({chartData.length}{" "}
          kategori)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            value: {
              label: "Pendapatan",
            },
          }}
          className="h-[300px]"
        >
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, props) => [
                    new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(Number(value)),
                    props.payload.name,
                  ]}
                />
              }
            />
          </PieChart>
        </ChartContainer>
        <div className="mt-4 space-y-2">
          {chartData.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-emerald-800 font-medium">
                  {item.name}
                </span>
              </div>
              <span className="font-semibold text-emerald-700">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(item.value)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
