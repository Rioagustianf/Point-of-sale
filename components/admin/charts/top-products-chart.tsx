"use client";
import { Bar, BarChart, XAxis, YAxis, Cell } from "recharts";
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

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface TopProductsChartProps {
  data: Array<{
    product_id: number;
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }>;
}

const THEMES = { light: "", dark: ".dark" } as const;

export function TopProductsChart({ data }: TopProductsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Produk Terlaris</CardTitle>
          <CardDescription>
            Top 8 produk berdasarkan jumlah terjual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Tidak ada data tersedia
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data
    .filter((item) => item.product_name && item.total_quantity > 0)
    .slice(0, 8)
    .map((item) => ({
      name:
        item.product_name.length > 15
          ? `${item.product_name.substring(0, 15)}...`
          : item.product_name,
      quantity: item.total_quantity,
      revenue: item.total_revenue,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Produk Terlaris</CardTitle>
        <CardDescription>
          Top {chartData.length} produk berdasarkan jumlah terjual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            theme: THEMES.light,
            colors: ["#123456", "#789012"],
          }}
          className="h-[300px]"
        >
          <BarChart data={chartData}>
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={70}
              tick={{ fontSize: 12 }}
            />
            <YAxis tickFormatter={(value) => `${value} unit`} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [`${value} unit`, "Terjual"]}
                />
              }
            />
            <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
