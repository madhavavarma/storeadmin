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

export default function Dashboard() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [orders, setOrders] = useState<IOrder[]>([]);
  // const [loading, setLoading] = useState(true);
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
      const [cat, prod, ord] = await Promise.all([
        getCategories(),
        getProducts(),
        getOrders(),
      ]);
      setCategories(cat || []);
      setProducts(prod || []);
      setOrders(ord || []);
    }
    fetchData();
  }, [dateRange]);

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
  const totalCategories = filteredCategories.length;
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce(
    (sum, o) => sum + (o.totalprice || 0),
    0
  );

  // Last week values
  // Last week values (filtered by date range, not last week)
  const lastWeekOrders = filteredOrders;
  const lastWeekProducts = filteredProducts.length;
  const lastWeekCategories = filteredCategories.length;
  const lastWeekRevenue = filteredOrders.reduce(
    (sum, o) => sum + (o.totalprice || 0),
    0
  );

  // Previous week values


  // Previous week values (not used with global date range)
  const prevWeekOrders = [];
  const prevWeekProducts = 0;
  const prevWeekCategories = 0;
  const prevWeekRevenue = 0;

  function percentChange(current: number, prev: number): number {
    if (prev === 0) return current === 0 ? 0 : 100;
    return ((current - prev) / prev) * 100;
  }
  const ordersChange = percentChange(
    lastWeekOrders.length,
    prevWeekOrders.length
  );
  const productsChange = percentChange(lastWeekProducts, prevWeekProducts);
  const categoriesChange = percentChange(
    lastWeekCategories,
    prevWeekCategories
  );
  const revenueChange = percentChange(lastWeekRevenue, prevWeekRevenue);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* Products Card */}
        <Card className="p-0 shadow-md border border-gray-100">
          <div className="flex items-center gap-4 p-4 pb-0">
            <div className="bg-green-100 rounded-xl p-3 flex items-center justify-center">
              📦
            </div>
            <div className="flex-1">
              <div className="text-gray-500 text-sm font-medium">
                Total Products
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {totalProducts.toLocaleString()}
              </div>
            </div>
          </div>
          <div
            className="flex items-center justify-between px-4 pb-3 pt-2 text-xs bg-blue-50/60 rounded-b-xl cursor-pointer hover:bg-blue-100 transition"
            onClick={() => navigate("/products")}
          >
            <span
              className={
                productsChange >= 0
                  ? "text-green-600 font-semibold flex items-center gap-1"
                  : "text-red-600 font-semibold flex items-center gap-1"
              }
            >
              {productsChange >= 0 ? "▲" : "▼"} {Math.abs(productsChange).toFixed(1)}%
            </span>
            <span className="text-gray-500">
              Last Week: {lastWeekProducts.toLocaleString()}
            </span>
            <span className="text-blue-600 font-medium hover:underline ml-auto">
              View More
            </span>
          </div>
        </Card>

        {/* Categories Card */}
        <Card className="p-0 shadow-md border border-gray-100">
          <div className="flex items-center gap-4 p-4 pb-0">
            <div className="bg-blue-100 rounded-xl p-3 flex items-center justify-center">
              📂
            </div>
            <div className="flex-1">
              <div className="text-gray-500 text-sm font-medium">
                Total Categories
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {totalCategories.toLocaleString()}
              </div>
            </div>
          </div>
          <div
            className="flex items-center justify-between px-4 pb-3 pt-2 text-xs bg-blue-50/60 rounded-b-xl cursor-pointer hover:bg-blue-100 transition"
            onClick={() => navigate("/categories")}
          >
            <span
              className={
                categoriesChange >= 0
                  ? "text-green-600 font-semibold flex items-center gap-1"
                  : "text-red-600 font-semibold flex items-center gap-1"
              }
            >
              {categoriesChange >= 0 ? "▲" : "▼"} {Math.abs(categoriesChange).toFixed(1)}%
            </span>
            <span className="text-gray-500">
              Last Week: {lastWeekCategories.toLocaleString()}
            </span>
            <span className="text-blue-600 font-medium hover:underline ml-auto">
              View More
            </span>
          </div>
        </Card>

        {/* Orders Card */}
        <Card className="p-0 shadow-md border border-gray-100">
          <div className="flex items-center gap-4 p-4 pb-0">
            <div className="bg-orange-100 rounded-xl p-3 flex items-center justify-center">
              🛒
            </div>
            <div className="flex-1">
              <div className="text-gray-500 text-sm font-medium">
                Total Orders
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {totalOrders.toLocaleString()}
              </div>
            </div>
          </div>
          <div
            className="flex items-center justify-between px-4 pb-3 pt-2 text-xs bg-blue-50/60 rounded-b-xl cursor-pointer hover:bg-blue-100 transition"
            onClick={() => navigate("/orders")}
          >
            <span
              className={
                ordersChange >= 0
                  ? "text-green-600 font-semibold flex items-center gap-1"
                  : "text-red-600 font-semibold flex items-center gap-1"
              }
            >
              {ordersChange >= 0 ? "▲" : "▼"} {Math.abs(ordersChange).toFixed(1)}%
            </span>
            <span className="text-gray-500">
              Last Week: {lastWeekOrders.length.toLocaleString()}
            </span>
            <span className="text-blue-600 font-medium hover:underline ml-auto">
              View More
            </span>
          </div>
        </Card>

        {/* Revenue Card */}
        <Card className="p-0 shadow-md border border-gray-100">
          <div className="flex items-center gap-4 p-4 pb-0">
            <div className="bg-pink-100 rounded-xl p-3 flex items-center justify-center">
              💰
            </div>
            <div className="flex-1">
              <div className="text-gray-500 text-sm font-medium">
                Total Revenue
              </div>
              <div className="text-2xl font-bold text-gray-800">
                ₹{totalRevenue.toLocaleString()}
              </div>
            </div>
          </div>
          <div
            className="flex items-center justify-between px-4 pb-3 pt-2 text-xs bg-blue-50/60 rounded-b-xl cursor-pointer hover:bg-blue-100 transition"
            onClick={() => navigate("/orders")}
          >
            <span
              className={
                revenueChange >= 0
                  ? "text-green-600 font-semibold flex items-center gap-1"
                  : "text-red-600 font-semibold flex items-center gap-1"
              }
            >
              {revenueChange >= 0 ? "▲" : "▼"} {Math.abs(revenueChange).toFixed(1)}%
            </span>
            <span className="text-gray-500">
              Last Week: ₹{lastWeekRevenue.toLocaleString()}
            </span>
            <span className="text-blue-600 font-medium hover:underline ml-auto">
              View More
            </span>
          </div>
        </Card>
      </div>

      {/* Recent Orders and Users/Order Count side by side */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col justify-center">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Recent Orders
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-yellow-50 text-left text-gray-600">
                  <th className="p-3 font-medium">Order ID</th>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Total</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b hover:bg-yellow-50 transition cursor-pointer"
                    onClick={() =>
                      navigate("/orders", { state: { openOrderId: order.id } })
                    }
                    title="View order details"
                  >
                    <td className="p-3">{order.id}</td>
                    <td className="p-3">{order.created_at?.slice(0, 10)}</td>
                    <td className="p-3">₹{order.totalprice}</td>
                    <td className="p-3">
                      <span
                        className="px-2 py-1 text-xs rounded-md border font-medium"
                        style={{
                          background:
                            order.status === "Delivered"
                              ? "#e6ffed"
                              : order.status === "Pending"
                              ? "#fffbe6"
                              : "#f0f0f0",
                          color:
                            order.status === "Delivered"
                              ? "#16a34a"
                              : order.status === "Pending"
                              ? "#b45309"
                              : "#64748b",
                          borderColor:
                            order.status === "Delivered"
                              ? "#bbf7d0"
                              : order.status === "Pending"
                              ? "#fde68a"
                              : "#e5e7eb",
                        }}
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


      {/* Orders Per Day and Categories Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Orders Per Day Chart */}
        <div className="flex flex-col bg-white rounded-xl shadow-sm p-6 min-h-full h-full">
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

        {/* Category List */}
        <div className="flex flex-col bg-white rounded-xl shadow-sm p-6 min-h-full h-full">
          <h2 className="text-lg font-semibold mb-4 text-blue-700">Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {categoryStats.map((cat) => (
              <Card
                key={cat.id}
                className="p-4 flex flex-col gap-2 border border-blue-100 bg-blue-50/50 hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="h-10 w-10 object-contain rounded-md border"
                  />
                  <div>
                    <div className="font-semibold text-gray-700">{cat.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {cat.productCount} products, {cat.orderCount} orders
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>


       {/* Recent Orders and Users/Order Count side by side */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-6">
      {/* Users and Their Order Count Table */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col justify-center">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">
            Users and Their Order Count
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-blue-50 text-left text-gray-600">
                  <th className="p-3 font-medium">User</th>
                  <th className="p-3 font-medium">Order Count</th>
                </tr>
              </thead>
              <tbody>
                {userOrderList.map((user) => (
                  <tr
                    key={user.name}
                    className="border-b hover:bg-blue-50 transition"
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
