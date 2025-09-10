
import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Customer {
  userid: string;
  email?: string;
  first_order: string;
  orders: number;
  total_spent: number;
}


export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 6;

  useEffect(() => {
    setLoading(true);
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        setIsLoggedIn(true);
        // Get all orders
  const { data: ordersData, error: ordersError } = await supabase.from("orders").select("userid,created_at,totalprice");
        if (ordersError) {
          setError("Failed to load orders");
          setLoading(false);
          return;
        }
        // Group by userid
        const customerMap: { [userid: string]: Customer } = {};
        (ordersData || []).forEach((order: any) => {
          if (!customerMap[order.userid]) {
            customerMap[order.userid] = {
              userid: order.userid,
              first_order: order.created_at,
              orders: 1,
              total_spent: order.totalprice || 0,
            };
          } else {
            customerMap[order.userid].orders += 1;
            customerMap[order.userid].total_spent += order.totalprice || 0;
            // Update first_order to earliest
            if (new Date(order.created_at) < new Date(customerMap[order.userid].first_order)) {
              customerMap[order.userid].first_order = order.created_at;
            }
          }
        });
        setCustomers(Object.values(customerMap));
        setLoading(false);
      } else {
        setIsLoggedIn(false);
        setCustomers([]);
        setLoading(false);
      }
    });
  }, []);

  const totalPages = Math.ceil(customers.length / perPage);
  const paginated = customers.slice((currentPage - 1) * perPage, currentPage * perPage);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
        <svg className="animate-spin h-8 w-8 text-green-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <span className="text-green-700 font-medium text-lg">Loading customers...</span>
      </div>
    );
  }
  if (isLoggedIn === false) {
    return <div className="p-8 text-center text-gray-500">Please log in to view customers.</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-semibold mb-4">All Customers</h2>
      <div className="bg-white shadow-sm rounded-xl p-4">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-green-50 text-left text-gray-600">
                <th className="p-3 font-medium">User ID</th>
                <th className="p-3 font-medium">First Order</th>
                <th className="p-3 font-medium">Orders</th>
                <th className="p-3 font-medium">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((customer) => (
                <tr key={customer.userid} className="border-b hover:bg-green-50 cursor-pointer transition">
                  <td className="p-3 font-medium text-gray-700">{customer.userid}</td>
                  <td className="p-3">{new Date(customer.first_order).toLocaleDateString()}</td>
                  <td className="p-3">{customer.orders}</td>
                  <td className="p-3">₹{customer.total_spent.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile Card List */}
        <div className="grid md:hidden gap-3">
          {paginated.map((customer) => (
            <div key={customer.userid} className="flex flex-col gap-2 p-3 rounded-xl border shadow-sm hover:bg-green-50 cursor-pointer transition">
              <div className="font-medium text-gray-700">User: {customer.userid}</div>
              <div className="text-xs text-gray-500">First Order: {new Date(customer.first_order).toLocaleDateString()}</div>
              <div className="text-xs">Orders: {customer.orders}</div>
              <div className="text-xs">Total Spent: ₹{customer.total_spent.toLocaleString()}</div>
            </div>
          ))}
        </div>
        {/* Pagination */}
        <div className="flex flex-col items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-md"
            >
              <ChevronLeft size={16} /> Previous
            </Button>
            <span className="px-3 text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md"
            >
              Next <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
