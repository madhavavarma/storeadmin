import { useState, useEffect, useCallback } from "react"
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime"
import { useDispatch } from "react-redux"
import { OrdersActions, OrderStatus } from "@/store/OrdersSlice"
import OrderSummary from "./OrderDrawer"
import { updateOrder, getOrders } from "../api"
import {
  Package,
  Truck,
  Gift,
  PersonStandingIcon,
} from "lucide-react"

const summaryCardDefs = [
  { title: "Pending", status: "Pending", icon: PersonStandingIcon, color: "bg-lime-50 text-lime-600" },
  { title: "In Progress", status: "Processing", icon: Package, color: "bg-lime-50 text-lime-600" },
  { title: "Order Shipped", status: "Shipped", icon: Truck, color: "bg-green-50 text-green-600" },
  { title: "Delivered", status: "Delivered", icon: Gift, color: "bg-emerald-50 text-emerald-600" },
];

export interface OrderRow {
  id: string;
  createdAt: string;
  customer: string;
  total: string;
  paymentStatus: string;
  items: number;
  deliveryNumber?: string;
  orderStatus: string;
  raw?: any;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Paid: "bg-green-100 text-green-700 border border-green-300",
    Unpaid: "bg-amber-100 text-amber-700 border border-amber-300",
    Refund: "bg-rose-100 text-rose-700 border border-rose-300",
    Draft: "bg-gray-100 text-gray-600 border border-gray-300",
    Packaging: "bg-lime-100 text-lime-700 border border-lime-300",
    Completed: "bg-emerald-100 text-emerald-700 border border-emerald-300",
    Cancelled: "bg-rose-200 text-rose-800 border border-rose-400",
    Processing: "bg-teal-100 text-teal-700 border border-teal-300",
    Shipped: "bg-sky-100 text-sky-700 border border-sky-300",
    Delivered: "bg-green-200 text-green-800 border border-green-400",
    Returned: "bg-orange-100 text-orange-700 border border-orange-300",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-md shadow-sm transition ${colors[status] || "bg-gray-100 text-gray-600 border border-gray-300"}`}
    >
      {status}
    </span>
  );
}

export default function Orders({ refreshKey }: { refreshKey?: number }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  // const [pendingStatus, setPendingStatus] = useState<{ [orderId: string]: string }>({});
  const dispatch = useDispatch();

  // Clear orders on signout
  useEffect(() => {
    const clear = () => setOrders([]);
    window.addEventListener("clearOrders", clear);
    return () => window.removeEventListener("clearOrders", clear);
  }, []);

  const fetchOrders = useCallback(() => {
    getOrders().then((data) => {
      if (data) {
        setOrders(
          data.map((order: any) => ({
            id: order.id,
            createdAt: order.created_at || order.createdAt || "",
            customer:
              order.customer ||
              order.checkoutdata?.name ||
              order.checkoutdata?.phone ||
              "Unknown",
            total: order.totalprice ? `₹${order.totalprice}` : "",
            paymentStatus: order.paymentStatus || order.checkoutdata?.paymentStatus || "Unpaid",
            items: order.cartitems ? order.cartitems.length : order.items || 0,
            deliveryNumber: order.deliveryNumber,
            orderStatus: order.status || order.orderStatus || "",
            raw: order,
          }))
        );
      }
    });
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, refreshKey]);

  useOrdersRealtime(fetchOrders);

  return (
    <div className="p-6 space-y-8">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {summaryCardDefs.map((card) => {
          const Icon = card.icon;
          const value = orders.filter((o) => o.orderStatus === card.status).length;
          return (
            <div
              key={card.title}
              className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center hover:shadow-lg transition"
            >
              <div className={`p-3 rounded-md ${card.color} mb-3`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-sm text-gray-500">{card.title}</span>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</span>
            </div>
          );
        })}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100">All Orders</h2>
          <select className="border rounded-md px-3 py-1.5 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200">
            <option>This Month</option>
            <option>Last Month</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left w-1/4">Order / Status</th>
                <th className="px-6 py-3 text-left w-1/4">Customer / Date</th>
                <th className="px-6 py-3 text-left w-1/4">Total / Products</th>
                <th className="px-6 py-3 text-left w-1/4">Next Step</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => {
                const statusFlow = [
                  "Pending",
                  "Confirmed",
                  "Processing",
                  "Shipped",
                  "Delivered",
                  "Cancelled",
                  "Returned",
                ];
                const currentIdx = statusFlow.indexOf(order.orderStatus);
                const nextStatus =
                  currentIdx >= 0 && currentIdx < statusFlow.length - 1
                    ? statusFlow[currentIdx + 1]
                    : null;
                // Calculate product and item counts
                const productCount = order.raw?.cartitems ? order.raw.cartitems.length : 0;
                const itemCount = order.raw?.cartitems ? order.raw.cartitems.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) : 0;
                return (
                  <tr
                    key={order.id}
                    className={`
                      transition-all duration-300 
                      ${idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"} 
                      hover:bg-green-50/40 dark:hover:bg-green-900/40 cursor-pointer
                    `}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).tagName === "BUTTON") return;
                      dispatch(OrdersActions.showOrderDetail(order.raw));
                      setDrawerOpen(true);
                      setTimeout(() => setDrawerVisible(true), 10);
                    }}
                  >
                    {/* Order Id + Status */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm tracking-wide">
                          #{order.id}
                        </span>
                        <StatusBadge status={order.orderStatus} />
                      </div>
                    </td>

                    {/* Customer + Date */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col gap-1">
                        <span
                          className="font-medium text-gray-800 dark:text-gray-200 truncate"
                          title={order.customer}
                        >
                          {order.customer}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : ""}
                        </span>
                      </div>
                    </td>

                    {/* Total + Products (same row) */}
                    <td className="px-6 py-4 text-left align-top">
                      <div className="flex flex-col items-start gap-2">
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                          {order.total}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {productCount} products {itemCount > 1 ? `${itemCount} items` : ""}
                        </span>
                      </div>
                    </td>

                    {/* Next Step Button */}
                    <td className="px-6 py-4 text-left align-top">
                      {nextStatus && (
                        <button
                          className="px-3 py-1.5 text-xs rounded-md bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600 border border-green-200 dark:border-green-500 shadow-sm transition hover:scale-105"
                          onClick={async e => {
                            e.stopPropagation();
                            await updateOrder(order.id, { status: nextStatus as OrderStatus });
                            fetchOrders();
                          }}
                        >
                          Move to {nextStatus}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {orders.map((order) => {
          const statusFlow = [
            "Pending",
            "Confirmed",
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled",
            "Returned",
          ];
          const currentIdx = statusFlow.indexOf(order.orderStatus);
          const nextStatus =
            currentIdx >= 0 && currentIdx < statusFlow.length - 1
              ? statusFlow[currentIdx + 1]
              : null;
          const productCount = order.raw?.cartitems ? order.raw.cartitems.length : 0;
          const itemCount = order.raw?.cartitems ? order.raw.cartitems.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) : 0;
          return (
            <div
              key={order.id}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3 transition hover:shadow-xl"
              onClick={() => {
                dispatch(OrdersActions.showOrderDetail(order.raw));
                setDrawerOpen(true);
                setTimeout(() => setDrawerVisible(true), 10);
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-base">#{order.id}</span>
                <StatusBadge status={order.orderStatus} />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>{order.customer}</span>
                <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                <span>{order.total}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">|</span>
                <span>{productCount} products{itemCount > 1 ? `, ${itemCount} items` : ""}</span>
              </div>
              {nextStatus && (
                <button
                  className="mt-2 px-3 py-1.5 text-xs rounded-md bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600 border border-green-200 dark:border-green-500 shadow-sm transition hover:scale-105 text-left w-fit"
                  onClick={async e => {
                    e.stopPropagation();
                    await updateOrder(order.id, { status: nextStatus as OrderStatus });
                    fetchOrders();
                  }}
                >
                  Move to {nextStatus}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div
          className={`fixed inset-0 z-50 bg-black/40 flex items-start justify-end transition-opacity duration-300 ${
            drawerVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => {
            setDrawerVisible(false);
            setTimeout(() => setDrawerOpen(false), 300);
          }}
        >
          <div
            className={`bg-white dark:bg-gray-900 rounded-l-xl shadow-2xl max-w-xl w-full h-full relative overflow-y-auto transition-transform duration-300 ${
              drawerVisible ? "translate-x-0" : "translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
              onClick={() => {
                setDrawerVisible(false);
                setTimeout(() => setDrawerOpen(false), 300);
              }}
            >
              &times;
            </button>
            <OrderSummary
              onClose={() => {
                setDrawerVisible(false);
                setTimeout(() => {
                  setDrawerOpen(false);
                  fetchOrders();
                }, 300);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
