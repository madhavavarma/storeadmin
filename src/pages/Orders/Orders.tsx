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
    Paid: "bg-green-200 text-green-800 border border-green-400",
    Unpaid: "bg-gray-200 text-gray-800 border border-gray-400",
    Refund: "bg-blue-200 text-blue-800 border border-blue-400",
    Draft: "bg-gray-100 text-gray-700 border border-gray-300",
    Packaging: "bg-yellow-200 text-yellow-800 border border-yellow-400",
    Completed: "bg-emerald-200 text-emerald-800 border border-emerald-400",
    Canceled: "bg-red-200 text-red-800 border border-red-400",
  };
  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-bold rounded-full shadow-sm ${
        colors[status] || "bg-gray-100 text-gray-700 border border-gray-300"
      }`}
    >
      {status}
    </span>
  );
}

export default function Orders() {
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
  }, [fetchOrders]);

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
              className="bg-white p-4 rounded-xl shadow-md border flex flex-col items-center justify-center"
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
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
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
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
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
                    className="border-b hover:bg-gray-50 cursor-pointer group"
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
                        <span className="font-semibold text-gray-800">{order.id}</span>
                        <span className="mt-1"><StatusBadge status={order.orderStatus} /></span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap w-auto text-right align-top">
                      <div className="flex flex-col gap-1 items-end">
                        <span
                          className="font-medium text-blue-600 max-w-[80px] truncate cursor-pointer"
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
                            className="absolute z-50 left-1/2 -translate-x-1/2 mt-6 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none"
                            style={{ minWidth: 'max-content' }}
                          >
                            {order.customer}
                          </span>
                        </span>
                        <span className="text-xs text-gray-500">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap w-auto align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-gray-800">{order.total}</span>
                        <span className="flex items-center gap-2">
                          <StatusBadge status={order.paymentStatus} />
                          <span className="text-xs text-gray-500">{order.items} items</span>
                        </span>
                      </div>
                    </td>
                    {/* <td className="px-4 py-3">{order.deliveryNumber}</td> */}
                    <td className="px-4 py-3 whitespace-nowrap w-auto text-center align-top">
                      {nextStatus && (
                        <button
                          className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300 transition"
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
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
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