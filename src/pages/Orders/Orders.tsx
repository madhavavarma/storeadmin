import { useState, useEffect, useCallback } from "react"
import { useLocation } from "react-router-dom"
import { supabase } from "@/supabaseClient"
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
  const location = useLocation();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  // Removed unused drawerOrder state
  // const [pendingStatus, setPendingStatus] = useState<{ [orderId: string]: string }>({});
  const dispatch = useDispatch();


  // Live update state
  const [liveUpdates, setLiveUpdates] = useState(() => {
    const stored = localStorage.getItem("liveUpdates");
    return stored === null ? true : stored === "true";
  });
  // Date range state
  const [dateRange, setDateRange] = useState(() => {
    const stored = localStorage.getItem("dateRange");
    return stored ? JSON.parse(stored) : { label: "Today", value: "today", start: null, end: null };
  });
  useEffect(() => {
    const liveHandler = () => {
      const stored = localStorage.getItem("liveUpdates");
      setLiveUpdates(stored === null ? true : stored === "true");
    };
    const dateHandler = () => {
      const stored = localStorage.getItem("dateRange");
      setDateRange(stored ? JSON.parse(stored) : { label: "Today", value: "today", start: null, end: null });
    };
    window.addEventListener("liveUpdatesChanged", liveHandler);
    window.addEventListener("dateRangeChanged", dateHandler);
    return () => {
      window.removeEventListener("liveUpdatesChanged", liveHandler);
      window.removeEventListener("dateRangeChanged", dateHandler);
    };
  }, []);

  // Clear orders on signout
  useEffect(() => {
    const clear = () => setOrders([]);
    window.addEventListener("clearOrders", clear);
    return () => window.removeEventListener("clearOrders", clear);
  }, []);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setIsLoggedIn(true);
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
        getOrders().then((ordersData) => {
          if (ordersData) {
            let filtered = ordersData;
            if (from && to) {
              filtered = ordersData.filter((order: any) => {
                const created = new Date(order.created_at || order.createdAt);
                return created >= from && created < to;
              });
            }
            setOrders(
              filtered.map((order: any) => ({
                id: order.id,
                createdAt: order.created_at || order.createdAt || "",
                customer:
                  order.customer ||
                  order.checkoutdata?.name ||
                  order.checkoutdata?.phone ||
                  "Unknown",
                total: order.totalprice ? `\u20b9${order.totalprice}` : "",
                paymentStatus: order.paymentStatus || order.checkoutdata?.paymentStatus || "Unpaid",
                items: order.cartitems ? order.cartitems.length : order.items || 0,
                deliveryNumber: order.deliveryNumber,
                orderStatus: order.status || order.orderStatus || "",
                raw: order,
              }))
            );
          }
          setLoading(false);
        });
      } else {
        setIsLoggedIn(false);
        setOrders([]);
        setLoading(false);
      }
    });
  }, [dateRange, refreshKey]);


  // Open drawer if openOrderId is passed in location.state

  // Always load once on mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, refreshKey]);

  // Only poll if liveUpdates is enabled
  useEffect(() => {
    if (!liveUpdates) return;
    const interval = setInterval(() => {
      fetchOrders();
    }, 10000);
    return () => clearInterval(interval);
  }, [liveUpdates, fetchOrders]);

  useEffect(() => {
    if (location.state && location.state.openOrderId && orders.length > 0) {
      const order = orders.find(o => o.id === location.state.openOrderId || o.raw?.id === location.state.openOrderId);
      if (order) {
        dispatch(OrdersActions.showOrderDetail(order.raw || order));
        setDrawerOpen(true);
        setTimeout(() => setDrawerVisible(true), 10);
      }
    }
    // eslint-disable-next-line
  }, [location.state, orders]);

  // Only subscribe to realtime if liveUpdates enabled
  useOrdersRealtime(liveUpdates ? fetchOrders : () => {});

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
        <svg className="animate-spin h-8 w-8 text-green-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <span className="text-green-700 font-medium text-lg">Loading orders...</span>
      </div>
    );
  }
  if (isLoggedIn === false) {
    return <div className="p-8 text-center text-gray-500">Please log in to view orders.</div>;
  }

  return (
    <div className="p-2 md:p-6 space-y-4 md:space-y-8">
      {/* Top Summary Cards */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6">
        {summaryCardDefs.map((card) => {
          const Icon = card.icon;
          const value = orders.filter((o) => o.orderStatus === card.status).length;
          return (
            <div
              key={card.title}
              className="rounded-2xl p-4 shadow-sm cursor-pointer transition hover:shadow-md border flex flex-col items-center justify-center text-center bg-gradient-to-tr from-green-50 to-white dark:from-zinc-900 dark:to-zinc-800"
            >
              <div className={`p-3 rounded-md ${card.color} dark:bg-zinc-800 dark:text-green-300 mb-3`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-200">{card.title}</span>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</span>
            </div>
          );
        })}
      </div>

      {/* Desktop Table */}
  <div className="hidden md:block bg-white dark:bg-zinc-900 shadow-sm rounded-xl p-4 border border-gray-200 dark:border-zinc-800 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-green-50 dark:bg-zinc-800 text-left text-gray-600 dark:text-gray-200">
              <th className="p-3 font-medium">Order / Status</th>
              <th className="p-3 font-medium">Customer / Date</th>
              <th className="p-3 font-medium">Total / Products</th>
              <th className="p-3 font-medium">Next Step</th>
            </tr>
          </thead>
          <tbody>
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
                <tr
                  key={order.id}
                  className="border-b hover:bg-green-50 dark:hover:bg-zinc-800 cursor-pointer transition"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).tagName === "BUTTON") return;
                    dispatch(OrdersActions.showOrderDetail(order.raw));
                    setDrawerOpen(true);
                    setTimeout(() => setDrawerVisible(true), 10);
                  }}
                >
                  {/* Order Id + Status */}
                  <td className="p-3 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm tracking-wide">
                        #{order.id}
                      </span>
                      <StatusBadge status={order.orderStatus} />
                    </div>
                  </td>

                  {/* Customer + Date */}
                  <td className="p-3 align-top">
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
                  <td className="p-3 text-left align-top">
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
                  <td className="p-3 text-left align-top">
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

      {/* Mobile Card View */}
  <div className="grid md:hidden gap-2">
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
              className="rounded-2xl p-2 md:p-4 shadow-sm cursor-pointer transition hover:shadow-md border flex items-center gap-2 md:gap-3 justify-center text-center bg-white dark:bg-zinc-900"
              onClick={() => {
                dispatch(OrdersActions.showOrderDetail(order.raw));
                setDrawerOpen(true);
                setTimeout(() => setDrawerVisible(true), 10);
              }}
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 dark:text-gray-100 text-base">#{order.id}</span>
                  <StatusBadge status={order.orderStatus} />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>{order.customer}</span>
                  <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  <span>{order.total}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">|</span>
                  <span>{productCount} products{itemCount > 1 ? `, ${itemCount} items` : ""}</span>
                </div>
                {nextStatus && (
                  <button
                    className="mt-1 md:mt-2 px-2 md:px-3 py-1 text-xs rounded-md bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600 border border-green-200 dark:border-green-500 shadow-sm transition hover:scale-105 text-left w-fit"
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
            setTimeout(() => {
              setDrawerOpen(false);
            }, 300);
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
                setTimeout(() => {
                  setDrawerOpen(false);
                  // setDrawerOrder(null); (removed, no longer needed)
                }, 300);
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
