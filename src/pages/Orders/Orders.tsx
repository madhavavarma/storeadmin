import { useState, useEffect } from "react"
import {
  Package,
  ShoppingCart,
  Truck,
  Gift,
} from "lucide-react"

const summaryCards = [
  { title: "Order Cancel", value: 241, icon: ShoppingCart },
  { title: "Order Shipped", value: 630, icon: Truck },
  { title: "Delivered", value: 200, icon: Gift },
  { title: "In Progress", value: 656, icon: Package },
]

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
  const [page, setPage] = useState(1)
  const [orders, setOrders] = useState<OrderRow[]>([]);
  useEffect(() => {
    getOrders().then((data) => {
      if (data) {
        // Map API data to OrderRow structure if needed
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
          }))
        );
      }
    });
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Top Summary Cards */}
  <div className="grid grid-cols-2 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="bg-white p-4 rounded-xl shadow-md border flex flex-col items-center justify-center"
            >
              <div className="p-3 rounded-full bg-orange-50 text-orange-500 mb-2">
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-sm text-gray-500">{card.title}</span>
              <span className="text-lg font-bold">{card.value}</span>
            </div>
          )
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
                {/* <th className="px-4 py-3">Delivery Number</th> */}
                {/* <th className="px-4 py-3">Action</th> */}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
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
                      <span className="text-xs text-gray-500">{order.createdAt}</span>
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
                  {/*
                  <td className="px-4 py-3 flex items-center gap-2">
                    <button className="p-2 rounded-full bg-gray-100 hover:bg-blue-100">
                      <Eye className="w-4 h-4 text-blue-600" />
                    </button>
                    <button className="p-2 rounded-full bg-gray-100 hover:bg-orange-100">
                      <Edit className="w-4 h-4 text-orange-500" />
                    </button>
                    <button className="p-2 rounded-full bg-gray-100 hover:bg-red-100">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </td>
                  */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center p-4 border-t">
          <button
            className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </button>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded-md bg-orange-500 text-white">
              1
            </button>
            <button className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200">
              2
            </button>
            <button className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200">
              3
            </button>
          </div>
          <button
            className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
