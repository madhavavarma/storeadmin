import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import type { ICategory } from "@/interfaces/ICategory";
import type { IProduct } from "@/interfaces/IProduct";
import type { IOrder } from "@/store/OrdersSlice";

// Recharts imports
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { getCategories, getOrders, getProducts } from "../api";

export default function Dashboard({ refreshKey }: { refreshKey?: number }) {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const navigate = useNavigate();

  // Date range state
  const [dateRange, setDateRange] = useState(() => {
    const stored = localStorage.getItem("dateRange");
    return stored ? JSON.parse(stored) : { label: "Today", value: "today", start: null, end: null };
  });
  useEffect(() => {
    const dateHandler = () => {
      const stored = localStorage.getItem("dateRange");
      setDateRange(stored ? JSON.parse(stored) : { label: "Today", value: "today", start: null, end: null });
    };
    window.addEventListener("dateRangeChanged", dateHandler);
    return () => window.removeEventListener("dateRangeChanged", dateHandler);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const user = await import("@/supabaseClient").then(m => m.supabase.auth.getUser());
      if (user?.data?.user) {
        setIsLoggedIn(true);
        const [cat, prod, ord] = await Promise.all([
          getCategories(),
          getProducts(),
          getOrders(),
        ]);
        setCategories(cat || []);
        setProducts(prod || []);
        setOrders(ord || []);
      } else {
        setIsLoggedIn(false);
        setCategories([]);
        setProducts([]);
        setOrders([]);
      }
    }
    fetchData();
    // Listen for signout event to clear dashboard data
    const clear = () => {
      setCategories([]);
      setProducts([]);
      setOrders([]);
    };
    window.addEventListener("clearOrders", clear);
    return () => window.removeEventListener("clearOrders", clear);
  }, [dateRange, refreshKey]);
  if (isLoggedIn === false) {
    return <div className="p-8 text-center text-gray-500">Please log in to view dashboard.</div>;
  }

  // Date helpers




  // Date filtering logic
  let from = null, to = null;
  const now = new Date();
  if (dateRange.value === "today") {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (dateRange.value === "week") {
    const day = now.getDay();
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  } else if (dateRange.value === "month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  } else if (dateRange.value === "year") {
    from = new Date(now.getFullYear(), 0, 1);
    to = new Date(now.getFullYear() + 1, 0, 1);
  } else if (dateRange.value === "custom" && dateRange.start && dateRange.end) {
    from = new Date(dateRange.start);
    to = new Date(dateRange.end);
    to.setDate(to.getDate() + 1); // include end date
  }

  // Filtered data
  const filteredOrders = from && to ? orders.filter((o) => {
    const created = new Date(o.created_at);
    return created >= from && created < to;
  }) : orders;
  const filteredProducts = from && to && products.length > 0 && "created_at" in products[0]
    ? (products as any[]).filter((p) => {
        const created = new Date(p.created_at);
        return created >= from && created < to;
      })
    : products;
  const filteredCategories = from && to && categories.length > 0 && "created_at" in categories[0]
    ? (categories as any[]).filter((c) => {
        const created = new Date(c.created_at);
        return created >= from && created < to;
      })
    : categories;

  // Compute counts
  const totalProducts = filteredProducts.length;
  const activeProducts = filteredProducts.filter(p => p.ispublished !== false).length;
  const inactiveProducts = filteredProducts.filter(p => p.ispublished === false).length;
  // Show ALL categories, not filtered
  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.is_published !== false).length;
  const inactiveCategories = categories.filter(c => c.is_published === false).length;
  const totalOrders = filteredOrders.length;
  // Orders: count only pending for badge
  const pendingOrdersCount = filteredOrders.filter(o => (o.status || '').toLowerCase() === 'pending').length;
  const totalRevenue = filteredOrders.reduce(
    (sum, o) => sum + (o.totalprice || 0),
    0
  );
  // Calculate previous period for revenue comparison
  let prevFrom = null, prevTo = null, prevLabel = "Prev Range";
  if (from && to) {
    const diff = to.getTime() - from.getTime();
    prevFrom = new Date(from.getTime() - diff);
    prevTo = new Date(from.getTime());
    // Label for previous period
    if (dateRange.value === "today") prevLabel = "Prev Day";
    else if (dateRange.value === "week") prevLabel = "Prev Week";
    else if (dateRange.value === "month") prevLabel = "Prev Month";
    else if (dateRange.value === "year") prevLabel = "Prev Year";
  }
  const prevPeriodOrders = prevFrom && prevTo
    ? orders.filter((o) => {
        const created = new Date(o.created_at);
        return created >= prevFrom && created < prevTo;
      })
    : [];
  const prevPeriodRevenue = prevPeriodOrders.reduce(
    (sum, o) => sum + (o.totalprice || 0),
    0
  );
  const revenuePercentChange = prevPeriodRevenue === 0
    ? (totalRevenue === 0 ? 0 : 100)
    : ((totalRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100;
  // Order status counts (first letter, count)
  const orderStatusCounts: Record<string, number> = {};
  filteredOrders.forEach(o => {
    const status = (o.status || '').toString().charAt(0).toUpperCase();
    if (status) orderStatusCounts[status] = (orderStatusCounts[status] || 0) + 1;
  });

  // Category stats
  const categoryStats = filteredCategories.map((cat) => {
    const productCount = filteredProducts.filter((p) => p.category === cat.name).length;
    const orderCount = filteredOrders.filter((order) =>
      order.cartitems.some((item) => item.product.category === cat.name)
    ).length;
    return { ...cat, productCount, orderCount };
  });

  // Recent orders (sorted by created_at desc)
  const recentOrders = [...filteredOrders]
    .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
    .slice(0, 5);

  // Chart data (orders per day)
  const ordersByDay: { [date: string]: number } = {};
  filteredOrders.forEach((order) => {
    const date = order.created_at?.slice(0, 10);
    if (date) ordersByDay[date] = (ordersByDay[date] || 0) + 1;
  });
  const chartLabels = Object.keys(ordersByDay).sort();
  const chartData = chartLabels.map((date) => ordersByDay[date]);

  const chartDataset = chartLabels.map((date, i) => ({
    date: date.slice(5), // show MM-DD
    orders: chartData[i],
  }));

  // Compute user order counts
  const userOrderMap: Record<string, { name: string; count: number }> = {};
  filteredOrders.forEach((order) => {
    const name = order.checkoutdata?.phone || order.id || "Unknown";
    if (!userOrderMap[name]) {
      userOrderMap[name] = { name, count: 0 };
    }
    userOrderMap[name].count++;
  });
  const userOrderList = Object.values(userOrderMap).sort(
    (a, b) => b.count - a.count
  );

  return (
    <div className="p-6 space-y-8">
      {/* Top Stat Cards */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Products Card */}
        {/* Products Card */}
        <Card
          className="p-0 shadow-md border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors duration-300 cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-green-200 dark:hover:ring-green-800"
          onClick={() => navigate("/products")}
        >
          <div className="flex items-center gap-4 p-4 pb-0">
            <div className="bg-green-100 dark:bg-green-800 rounded-xl p-3 flex items-center justify-center">
              📦
            </div>
            <div className="flex-1">
              <div className="text-gray-500 dark:text-green-200 text-sm font-medium">
                Products
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-green-100">
                {totalProducts.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 pb-3 pt-2 text-xs bg-gray-50 dark:bg-zinc-800 rounded-b-xl">
            <span className="text-green-700 dark:text-green-300 font-semibold">Active: {activeProducts}</span>
            <span className="text-gray-400 font-semibold">Inactive: {inactiveProducts}</span>
          </div>
        </Card>

        {/* Categories Card */}
        <Card
          className="p-0 shadow-md border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors duration-300 cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-amber-200 dark:hover:ring-amber-800"
          onClick={() => navigate("/categories")}
        >
          <div className="flex items-center gap-4 p-4 pb-0">
            <div className="bg-amber-100 dark:bg-amber-800 rounded-xl p-3 flex items-center justify-center">
              📂
            </div>
            <div className="flex-1">
              <div className="text-gray-500 dark:text-amber-200 text-sm font-medium">
                Categories
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-amber-100">
                {totalCategories.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 pb-3 pt-2 text-xs bg-gray-50 dark:bg-zinc-800 rounded-b-xl">
            <span className="text-green-700 dark:text-green-300 font-semibold">Active: {activeCategories}</span>
            <span className="text-gray-400 font-semibold">Inactive: {inactiveCategories}</span>
          </div>
        </Card>

        {/* Orders Card */}
        <Card
          className="p-0 shadow-md border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors duration-300 cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-orange-200 dark:hover:ring-orange-800"
          onClick={() => navigate("/orders")}
        >
          <div className="flex items-center gap-4 p-4 pb-0">
            <div className="bg-orange-100 dark:bg-orange-800 rounded-xl p-3 flex items-center justify-center">
              🛒
            </div>
            <div className="flex-1">
              <div className="text-gray-500 dark:text-orange-200 text-sm font-medium flex items-center gap-2">
                Orders
                <span className="text-xs font-semibold text-green-600 dark:text-green-300">({dateRange.label})</span>
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-orange-100">
                {totalOrders.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap px-4 pb-3 pt-2 text-xs bg-gray-50 dark:bg-zinc-800 rounded-b-xl">
            {pendingOrdersCount > 0 && (
              <span
                className="inline-block bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 font-semibold rounded-full px-3 py-1 text-xs flex items-center gap-1 shadow-sm border border-yellow-200 dark:border-yellow-700 mb-1"
              >
                Pending Orders: <span className="font-mono text-xs ml-1">{pendingOrdersCount}</span>
              </span>
            )}
          </div>
        </Card>

        {/* Revenue Card */}
        <Card
          className="p-0 shadow-md border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors duration-300 cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-lime-200 dark:hover:ring-lime-800"
          onClick={() => navigate("/orders")}
        >
          <div className="flex items-center gap-4 p-4 pb-0">
            <div className="bg-lime-100 dark:bg-lime-800 rounded-xl p-3 flex items-center justify-center">
              💰
            </div>
            <div className="flex-1">
              <div className="text-gray-500 dark:text-lime-200 text-sm font-medium">
                Total Revenue
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-lime-100">
                ₹{totalRevenue.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 pb-3 pt-2 text-xs bg-gray-50 dark:bg-zinc-800 rounded-b-xl">
            <span className="inline-block bg-lime-100 dark:bg-lime-800 text-lime-800 dark:text-lime-100 font-semibold rounded-full px-3 py-1 text-xs flex items-center gap-1 shadow-sm border border-lime-200 dark:border-lime-700">
              <span className="font-bold">{prevLabel}</span>
              <span className="mx-1">•</span>
              <span className="font-mono">₹{prevPeriodRevenue.toLocaleString()}</span>
            </span>
            <span
              className={
                revenuePercentChange >= 0
                  ? "text-green-600 font-semibold flex items-center gap-1"
                  : "text-red-600 font-semibold flex items-center gap-1"
              }
            >
              {revenuePercentChange === 0 && prevPeriodRevenue === 0 ? "-" : (revenuePercentChange === 100 ? "" : (revenuePercentChange >= 0 ? "▲" : "▼") + " " + Math.abs(revenuePercentChange).toFixed(1) + "%")}
            </span>
          </div>
        </Card>
      </div>

      {/* Recent Orders and Users/Order Count side by side */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-6">
        {/* Recent Orders */}
  <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 flex flex-col justify-center border border-gray-100 dark:border-zinc-800">
          <h2 className="text-lg font-semibold mb-4 text-green-700 dark:text-green-300">
            Recent Orders
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-yellow-50 dark:bg-zinc-800 text-left text-gray-600 dark:text-gray-200">
                  <th className="p-3 font-semibold rounded-tl-xl">Order ID</th>
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold">Total</th>
                  <th className="p-3 font-semibold rounded-tr-xl">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, idx) => (
                  <tr
                    key={order.id}
                    className={`transition cursor-pointer ${
                      idx % 2 === 0
                        ? "bg-gray-50 dark:bg-zinc-900"
                        : "bg-white dark:bg-zinc-800"
                    } hover:bg-green-50 dark:hover:bg-green-900 group`}
                    onClick={() =>
                      navigate("/orders", { state: { openOrderId: order.id } })
                    }
                    title="View order details"
                  >
                    <td className="p-3 font-semibold text-gray-800 dark:text-green-200 group-hover:text-green-700 dark:group-hover:text-green-300">{order.id}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{order.created_at?.slice(0, 10)}</td>
                    <td className="p-3 text-green-700 dark:text-green-300 font-bold">₹{order.totalprice}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-md border font-semibold shadow-sm transition-colors
                          ${order.status === "Delivered"
                            ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                            : order.status === "Pending"
                            ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700"
                            : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-700"}
                        `}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>




      {/* Orders Per Day and Order Status Table Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Orders Per Day Chart */}
        <div className="flex flex-col bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6 min-h-full h-full col-span-1">
          <h2 className="text-lg font-semibold mb-4 text-green-700">
            Orders Per Day
          </h2>
          {chartDataset.length === 0 ? (
            <div className="w-full text-center text-gray-400 flex items-center justify-center h-40">
              No data for chart
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={chartDataset}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "#f0fdf4" }}
                  contentStyle={{
                    fontSize: "0.875rem",
                    borderRadius: "0.5rem",
                  }}
                />
                <Bar dataKey="orders" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Status Table Card */}
        <div className="flex flex-col bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6 min-h-full h-full col-span-1">
          <h2 className="text-lg font-semibold mb-4 text-orange-700 dark:text-orange-200 flex items-center gap-2">
            Order Statuses
            <span className="text-green-600 dark:text-green-300 font-semibold text-sm">({dateRange.label})</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-orange-50 dark:bg-zinc-800 text-left text-gray-600 dark:text-gray-200">
                  <th className="p-3 font-semibold rounded-tl-xl">Status</th>
                  <th className="p-3 font-semibold rounded-tr-xl">Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(orderStatusCounts).map(([status, count], idx) => (
                  <tr
                    key={status}
                    className={`transition ${idx % 2 === 0 ? "bg-gray-50 dark:bg-zinc-900" : "bg-white dark:bg-zinc-800"} hover:bg-orange-50 dark:hover:bg-orange-900 group`}
                  >
                    <td className="p-3 font-semibold text-gray-800 dark:text-orange-200 group-hover:text-orange-700 dark:group-hover:text-orange-300">
                      {status === "P" ? "Pending" :
                        status === "D" ? "Delivered" :
                        status === "C" ? "Cancelled" :
                        status === "F" ? "Failed" :
                        status === "S" ? "Shipped" :
                        status === "R" ? "Returned" :
                        status}
                    </td>
                    <td className="p-3 text-orange-700 dark:text-orange-300 font-bold group-hover:text-orange-900 dark:group-hover:text-orange-100">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Users and Their Order Count Table Only */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6 flex flex-col justify-center">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Users and Their Order Count
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-blue-50 dark:bg-zinc-800 text-left text-gray-600 dark:text-gray-200">
                  <th className="p-3 font-medium">User</th>
                  <th className="p-3 font-medium">Order Count</th>
                </tr>
              </thead>
              <tbody>
                {userOrderList.map((user) => (
                  <tr
                    key={user.name}
                    className="border-b hover:bg-blue-50 dark:hover:bg-zinc-800 transition"
                  >
                    <td className="p-3">{user.name}</td>
                    <td className="p-3">{user.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
