import { useState, useEffect, useCallback } from "react"
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime"
import { useDispatch } from "react-redux"
import { OrdersActions, OrderStatus } from "@/store/OrdersSlice"
import OrderSummary from "./OrderDrawer"
import { updateOrder } from "../api"
import {
  Package,
  ShoppingCart,
  Truck,
  Gift,
} from "lucide-react"


const summaryCardDefs = [
  { title: "Order Cancel", status: "Cancelled", icon: ShoppingCart },
  { title: "Order Shipped", status: "Shipped", icon: Truck },
  { title: "Delivered", status: "Delivered", icon: Gift },
  { title: "In Progress", status: "Processing", icon: Package },
];

import { getOrders } from "../api";

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
    Paid: "bg-zinc-200 text-zinc-800 border border-zinc-400",
    Unpaid: "bg-zinc-100 text-zinc-700 border border-zinc-300",
    Refund: "bg-zinc-300 text-zinc-900 border border-zinc-400",
    Draft: "bg-zinc-100 text-zinc-700 border border-zinc-300",
    Packaging: "bg-zinc-200 text-zinc-800 border border-zinc-400",
    Completed: "bg-zinc-300 text-zinc-900 border border-zinc-400",
    Canceled: "bg-zinc-400 text-zinc-900 border border-zinc-500",
  };
  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-bold rounded-full shadow-sm ${
  colors[status] || "bg-zinc-100 text-zinc-700 border border-zinc-300"
      }`}
    >
      {status}
    </span>
  );
}

export default function Orders({ refreshKey }: { refreshKey?: number }) {
  // Listen for clearOrders event to clear orders on signout
  useEffect(() => {
    const clear = () => setOrders([]);
    window.addEventListener('clearOrders', clear);
    return () => window.removeEventListener('clearOrders', clear);
  }, []);
  // const [page, setPage] = useState(1)
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const dispatch = useDispatch();
  const fetchOrders = useCallback(() => {
    getOrders().then((data) => {
      if (data) {
        setOrders(
          data.map((order: any) => ({
            id: order.id,
            createdAt: order.created_at || order.createdAt || '',
            customer: order.customer || (order.checkoutdata?.name || order.checkoutdata?.phone || 'Unknown'),
            total: order.totalprice ? `₹${order.totalprice}` : '',
            paymentStatus: order.paymentStatus || (order.checkoutdata?.paymentStatus || 'Unpaid'),
            items: order.cartitems ? order.cartitems.length : order.items || 0,
            deliveryNumber: order.deliveryNumber,
            orderStatus: order.status || order.orderStatus || '',
            raw: order // keep full order for drawer
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
    <div className="p-6 space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        {summaryCardDefs.map((card) => {
          const Icon = card.icon;
          const value = orders.filter(o => o.orderStatus === card.status).length;
          return (
            <div
              key={card.title}
              className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center"
            >
              <div className="p-3 rounded-full bg-orange-50 text-orange-500 mb-2">
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-sm text-gray-500">{card.title}</span>
              <span className="text-lg font-bold">{value}</span>
            </div>
          );
        })}
      </div>

      {/* Orders Table */}
  <div className="bg-white dark:bg-gray-900 shadow-md rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg">All Order List</h2>
          <select className="border rounded-md px-3 py-1 text-sm">
            <option>This Month</option>
            <option>Last Month</option>
          </select>
        </div>

        {/* Table Wrapper for Mobile */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-200 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap w-auto text-left">Order / Status</th>
                <th className="px-4 py-3 whitespace-nowrap w-auto text-right">Customer / Date</th>
                <th className="px-4 py-3 whitespace-nowrap w-auto">Total / Payment / Items</th>
                <th className="px-4 py-3 whitespace-nowrap w-auto text-center">Next Status</th>
                {/* <th className="px-4 py-3">Delivery Number</th> */}
                {/* <th className="px-4 py-3">Action</th> */}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                // Define the status flow
                const statusFlow = [
                  "Pending",
                  "Confirmed",
                  "Processing",
                  "Shipped",
                  "Delivered",
                  "Cancelled",
                  "Returned"
                ];
                const currentIdx = statusFlow.indexOf(order.orderStatus);
                const nextStatus =
                  currentIdx >= 0 && currentIdx < statusFlow.length - 1
                    ? statusFlow[currentIdx + 1]
                    : null;
                return (
                  <tr
                    key={order.id}
                    className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer group"
                    onClick={e => {
                      // Only open drawer if not clicking the button
                      if ((e.target as HTMLElement).tagName === 'BUTTON') return;
                      dispatch(OrdersActions.showOrderDetail(order.raw));
                      setDrawerOpen(true);
                      setTimeout(() => setDrawerVisible(true), 10);
                    }}
                  >
                    <td className="px-4 py-3 whitespace-nowrap w-auto text-left align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-100">{order.id}</span>
                        <span className="mt-1"><StatusBadge status={order.orderStatus} /></span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap w-auto text-right align-top">
                      <div className="flex flex-col gap-1 items-end">
                        <span
                          className="font-medium text-zinc-700 dark:text-zinc-200 max-w-[80px] truncate cursor-pointer"
                          title={order.customer}
                          tabIndex={0}
                          onTouchStart={e => {
                            const target = e.currentTarget;
                            target.setAttribute('data-show-tooltip', 'true');
                          }}
                          onTouchEnd={e => {
                            const target = e.currentTarget;
                            setTimeout(() => target.removeAttribute('data-show-tooltip'), 1500);
                          }}
                        >
                          {order.customer.length > 10 ? order.customer.slice(0, 10) + '…' : order.customer}
                          <span
                            className="absolute z-50 left-1/2 -translate-x-1/2 mt-6 px-2 py-1 bg-zinc-800 text-zinc-100 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none"
                            style={{ minWidth: 'max-content' }}
                          >
                            {order.customer}
                          </span>
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap w-auto align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-100">{order.total}</span>
                        <span className="flex items-center gap-2">
                          <StatusBadge status={order.paymentStatus} />
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">{order.items} items</span>
                        </span>
                      </div>
                    </td>
                    {/* <td className="px-4 py-3">{order.deliveryNumber}</td> */}
                    <td className="px-4 py-3 whitespace-nowrap w-auto text-center align-top">
                      {nextStatus && (
                        <button
                          className="px-2 py-1 text-xs rounded bg-zinc-200 text-zinc-800 hover:bg-zinc-300 border border-zinc-400 transition"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await updateOrder(order.id, { status: nextStatus as OrderStatus });
                            // Refresh orders after status update
                            getOrders().then((data) => {
                              if (data) {
                                setOrders(
                                  data.map((order: any) => ({
                                    id: order.id,
                                    createdAt: order.created_at || order.createdAt || '',
                                    customer: order.customer || (order.checkoutdata?.name || order.checkoutdata?.phone || 'Unknown'),
                                    total: order.totalprice ? `₹${order.totalprice}` : '',
                                    paymentStatus: order.paymentStatus || (order.checkoutdata?.paymentStatus || 'Unpaid'),
                                    items: order.cartitems ? order.cartitems.length : order.items || 0,
                                    deliveryNumber: order.deliveryNumber,
                                    orderStatus: order.status || order.orderStatus || '',
                                    raw: order // keep full order for drawer
                                  }))
                                );
                              }
                            });
                          }}
                        >
                          Move to {nextStatus}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
      {/* Order Drawer/Modal */}
      {drawerOpen && (
        <div
          className={`fixed inset-0 z-50 bg-black/40 flex items-start justify-end transition-opacity duration-300 ${drawerVisible ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => {
            setDrawerVisible(false);
            setTimeout(() => setDrawerOpen(false), 300);
          }}
        >
          <div
            className={`bg-white rounded-l-xl shadow-lg max-w-xl w-full h-full relative overflow-y-auto transition-transform duration-300 ${drawerVisible ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ height: '100vh' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 text-2xl"
              onClick={() => {
                setDrawerVisible(false);
                setTimeout(() => setDrawerOpen(false), 300);
              }}
            >
              &times;
            </button>
            <OrderSummary onClose={() => {
              setDrawerVisible(false);
              setTimeout(() => {
                setDrawerOpen(false);
                // Refresh orders after drawer closes
                getOrders().then((data) => {
                  if (data) {
                    setOrders(
                      data.map((order: any) => ({
                        id: order.id,
                        createdAt: order.created_at || order.createdAt || '',
                        customer: order.customer || (order.checkoutdata?.name || order.checkoutdata?.phone || 'Unknown'),
                        total: order.totalprice ? `₹${order.totalprice}` : '',
                        paymentStatus: order.paymentStatus || (order.checkoutdata?.paymentStatus || 'Unpaid'),
                        items: order.cartitems ? order.cartitems.length : order.items || 0,
                        deliveryNumber: order.deliveryNumber,
                        orderStatus: order.status || order.orderStatus || '',
                        raw: order // keep full order for drawer
                      }))
                    );
                  }
                });
              }, 300);
            }} />
          </div>
        </div>
      )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
  {/* Pagination removed for now */}
      </div>
    </div>
  )

}