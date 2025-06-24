import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import {
  Package,
  Users,
  Receipt,
  TrendingUp,
  BarChart3,
  Activity,
} from "lucide-react";
import { RevenueChart } from "@/components/admin/charts/revenue-chart";
import { TransactionChart } from "@/components/admin/charts/transaction-chart";
import { TopProductsChart } from "@/components/admin/charts/top-products-chart";
import { CategoryChart } from "@/components/admin/charts/category-chart";

// Helper function for consistent number formatting
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

async function getStats() {
  const [productsCount, usersCount, transactionsCount, totalRevenue] =
    await Promise.all([
      prisma.product.count(),
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        _sum: {
          total_price: true,
        },
      }),
    ]);

  return {
    productsCount,
    usersCount,
    transactionsCount,
    totalRevenue: Number(totalRevenue._sum.total_price || 0),
  };
}

async function getChartData() {
  try {
    // Get last 30 days revenue data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueData = await prisma.transaction.groupBy({
      by: ["transaction_date"],
      _sum: {
        total_price: true,
      },
      _count: {
        id: true,
      },
      where: {
        transaction_date: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        transaction_date: "asc",
      },
    });

    // Get top products
    const topProductsRaw = await prisma.transactionDetail.groupBy({
      by: ["product_id"],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 10,
    });

    // Get product details for top products
    const topProductsWithDetails = await Promise.all(
      topProductsRaw.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.product_id },
          select: { name: true },
        });
        return {
          product_id: item.product_id,
          product_name: product?.name || "Unknown Product",
          total_quantity: Number(item._sum.quantity || 0),
          total_revenue: Number(item._sum.subtotal || 0),
        };
      })
    );

    // Get category sales data
    const categoryDataRaw = await prisma.transactionDetail.groupBy({
      by: ["product_id"],
      _sum: {
        quantity: true,
        subtotal: true,
      },
    });

    // Group by category
    const categoryMap = new Map<
      string,
      { total_quantity: number; total_revenue: number }
    >();

    for (const item of categoryDataRaw) {
      const product = await prisma.product.findUnique({
        where: { id: item.product_id },
        include: { category: true },
      });

      if (product?.category) {
        const categoryName = product.category.name;
        const existing = categoryMap.get(categoryName) || {
          total_quantity: 0,
          total_revenue: 0,
        };

        categoryMap.set(categoryName, {
          total_quantity:
            existing.total_quantity + Number(item._sum.quantity || 0),
          total_revenue:
            existing.total_revenue + Number(item._sum.subtotal || 0),
        });
      }
    }

    const categorySales = Array.from(categoryMap.entries()).map(
      ([category_name, data]) => ({
        category_name,
        total_quantity: data.total_quantity,
        total_revenue: data.total_revenue,
      })
    );

    // Process revenue data for client
    const processedRevenueData = revenueData.map((item) => ({
      date: item.transaction_date.toISOString().split("T")[0],
      revenue: Number(item._sum.total_price || 0),
      transactions: item._count.id,
    }));

    return {
      revenueData: processedRevenueData,
      topProductsWithDetails,
      categorySales,
    };
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return {
      revenueData: [],
      topProductsWithDetails: [],
      categorySales: [],
    };
  }
}

export default async function AdminDashboard() {
  const [stats, chartData] = await Promise.all([getStats(), getChartData()]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 md:h-10 md:w-10 text-blue-600" />
            Dashboard Analitik
          </h1>
          <p className="text-slate-600 text-sm md:text-base">
            Pantau performa bisnis dan analisis penjualan secara real-time
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                Total Produk
              </CardTitle>
              <Package className="h-5 w-5 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold">
                {formatNumber(stats.productsCount)}
              </div>
              <p className="text-xs text-blue-200 mt-1">Produk tersedia</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100">
                Total Pengguna
              </CardTitle>
              <Users className="h-5 w-5 text-emerald-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold">
                {formatNumber(stats.usersCount)}
              </div>
              <p className="text-xs text-emerald-200 mt-1">Pengguna aktif</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">
                Total Transaksi
              </CardTitle>
              <Receipt className="h-5 w-5 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold">
                {formatNumber(stats.transactionsCount)}
              </div>
              <p className="text-xs text-purple-200 mt-1">Transaksi selesai</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-100">
                Total Penghasilan
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-amber-200" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">
                {formatCurrency(stats.totalRevenue)}
              </div>
              <p className="text-xs text-amber-200 mt-1">Pendapatan total</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg border border-blue-100">
            <RevenueChart data={chartData.revenueData} />
          </div>
          <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-lg border border-purple-100">
            <TransactionChart data={chartData.revenueData} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-gradient-to-br from-white to-emerald-50 rounded-xl shadow-lg border border-emerald-100">
            <CategoryChart data={chartData.categorySales} />
          </div>
          <div className="bg-gradient-to-br from-white to-amber-50 rounded-xl shadow-lg border border-amber-100">
            <TopProductsChart data={chartData.topProductsWithDetails} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 transition-all duration-300 cursor-pointer border border-slate-300">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Kelola Produk</p>
                  <p className="text-xs text-slate-600">Tambah & edit produk</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 transition-all duration-300 cursor-pointer border border-slate-300">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    Kelola Pengguna
                  </p>
                  <p className="text-xs text-slate-600">Manajemen pengguna</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 transition-all duration-300 cursor-pointer border border-slate-300">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    Lihat Transaksi
                  </p>
                  <p className="text-xs text-slate-600">Riwayat penjualan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 transition-all duration-300 cursor-pointer border border-slate-300">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Buat Laporan</p>
                  <p className="text-xs text-slate-600">
                    Ekspor data penjualan
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
