import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";

interface Customer {
  userid: string;
  first_order: string;
  orders: number;
  total_spent: number;
}

interface Order {
  id: string;
  created_at: string;
  totalprice: number;
  status: string;
}

interface CustomersProps {
  refreshKey?: number;
}

export default function Customers({ refreshKey }: CustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Customer | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const perPage = 6;
  const navigate = useNavigate();

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
    // Listen for signout event to clear customers
    const clear = () => setCustomers([]);
    window.addEventListener("clearOrders", clear);
    return () => {
      window.removeEventListener("liveUpdatesChanged", liveHandler);
      window.removeEventListener("dateRangeChanged", dateHandler);
      window.removeEventListener("clearOrders", clear);
    };
  }, [refreshKey]);

  // Always load once on mount and on dateRange change
  useEffect(() => {
    setLoading(true);
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        setIsLoggedIn(true);
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("id,userid,created_at,totalprice,status");
        if (ordersError) {
          setError("Failed to load orders");
          setLoading(false);
          return;
        }
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
        const filteredOrders = (ordersData || []).filter((order: any) => {
          if (!from || !to) return true;
          const created = new Date(order.created_at);
          return created >= from && created < to;
        });
        const customerMap: { [userid: string]: Customer } = {};
        filteredOrders.forEach((order: any) => {
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
  }, [dateRange, refreshKey]);

  // Only poll if liveUpdates is enabled
  useEffect(() => {
    if (!liveUpdates) return;
    const interval = setInterval(() => {
      setLoading(true);
      supabase.auth.getUser().then(async ({ data }) => {
        if (data?.user) {
          setIsLoggedIn(true);
          const { data: ordersData, error: ordersError } = await supabase
            .from("orders")
            .select("id,userid,created_at,totalprice,status");
          if (ordersError) {
            setError("Failed to load orders");
            setLoading(false);
            return;
          }
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
    }, 10000);
    return () => clearInterval(interval);
  }, [liveUpdates]);

  const handleUserClick = async (customer: Customer) => {
    setSelectedUser(customer);
    setDrawerOpen(true);
    setOrdersLoading(true);
    const { data: ordersData, error } = await supabase
      .from("orders")
      .select("id,created_at,totalprice,status")
      .eq("userid", customer.userid)
      .order("created_at", { ascending: false });
    setUserOrders(error ? [] : (ordersData as Order[]));
    setOrdersLoading(false);
  };

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
      <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-xl p-4">
        <div className="hidden md:block bg-white dark:bg-zinc-900 shadow-sm rounded-xl p-4 border border-gray-200 dark:border-zinc-800 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-green-50 dark:bg-zinc-800 text-left text-gray-600 dark:text-gray-200">
                <th className="p-3 font-medium">User ID</th>
                <th className="p-3 font-medium">First Order</th>
                <th className="p-3 font-medium">Orders</th>
                <th className="p-3 font-medium">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((customer, idx) => (
                <tr
                  key={customer.userid}
                  className={`border-b hover:bg-green-50 dark:hover:bg-zinc-800 cursor-pointer transition ${
                    idx % 2 === 0
                      ? "bg-white dark:bg-zinc-900"
                      : "bg-green-50 dark:bg-zinc-900"
                  }`}
                  onClick={() => handleUserClick(customer)}
                >
                  <td className="p-3 font-medium text-gray-700 dark:text-green-200">{customer.userid}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">{new Date(customer.first_order).toLocaleDateString()}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">{customer.orders}</td>
                  <td className="p-3 text-green-700 dark:text-green-300 font-bold">₹{customer.total_spent.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile Card List */}
        <div className="grid md:hidden gap-3">
          {paginated.map((customer) => (
            <div
              key={customer.userid}
              className="flex flex-col gap-2 p-3 rounded-xl border shadow-sm hover:bg-green-50 cursor-pointer transition"
              onClick={() => handleUserClick(customer)}
            >
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
      {/* User Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="max-w-md w-full px-6 py-8 flex flex-col">
          <div className="flex flex-col gap-8 h-full">
            <div className="font-bold text-lg text-green-700 mb-2">Customer Details</div>
            {selectedUser && (
              <Card className="p-6 bg-green-50/70 border border-green-100 rounded-xl shadow-sm">
                <div className="grid grid-cols-2 gap-y-5 gap-x-8">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">User ID</p>
                    <p className="text-sm font-medium text-gray-800 break-all">{selectedUser.userid}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">First Order</p>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(selectedUser.first_order).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Orders</p>
                    <p className="text-base font-semibold text-green-700">{selectedUser.orders}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Spent</p>
                    <p className="text-base font-semibold text-green-700">
                      ₹{selectedUser.total_spent.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            )}
            <div>
              <div className="font-semibold text-md mb-3">Orders</div>
              {ordersLoading ? (
                <div className="text-gray-500">Loading orders...</div>
              ) : userOrders.length === 0 ? (
                <div className="text-gray-400 italic">No orders found for this customer.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {userOrders.map((order) => (
                    <Card
                      key={order.id}
                      className="p-4 border rounded-lg shadow-sm hover:bg-green-50 cursor-pointer transition"
                      onClick={() => {
                        setDrawerOpen(false);
                        navigate("/orders", { state: { openOrderId: order.id } });
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-green-700">Order #{order.id}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">₹{order.totalprice.toLocaleString()}</div>
                          <div className="text-xs text-gray-600">{order.status}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
