

import { Sun, Moon, User, ShoppingCart, Bell, LogOut, RefreshCcw, CalendarDays } from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/Store";
import { toggleTheme, setUser } from "@/store/HeaderSlice";

import { useEffect, useState } from "react";


import { supabase } from "@/supabaseClient";

import AuthDrawer from "@/pages/Auth/AuthDrawer";



// export default function Header() {
export default function Header({ onAuthSuccess }: { onAuthSuccess?: () => void }) {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.header.theme);
  const user = useSelector((state: RootState) => state.header.user);

  const [authDrawerOpen, setAuthDrawerOpen] = useState(false);

  // Live update toggle state
  const [liveUpdates, setLiveUpdates] = useState(() => {
    const stored = localStorage.getItem("liveUpdates");
    return stored === null ? true : stored === "true";
  });

  // Date range state
  const defaultRange = { label: "Today", value: "today", start: null, end: null };
  const [dateRange, setDateRange] = useState(() => {
    const stored = localStorage.getItem("dateRange");
    return stored ? JSON.parse(stored) : defaultRange;
  });
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Broadcast date range changes
  useEffect(() => {
    localStorage.setItem("dateRange", JSON.stringify(dateRange));
    window.dispatchEvent(new CustomEvent("dateRangeChanged", { detail: dateRange }));
  }, [dateRange]);

  // Sync localStorage and broadcast event
  useEffect(() => {
    localStorage.setItem("liveUpdates", String(liveUpdates));
    window.dispatchEvent(new CustomEvent("liveUpdatesChanged", { detail: { enabled: liveUpdates } }));
  }, [liveUpdates]);


  // Add or remove dark mode class on html element
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);
  // Sidebar header: className="flex items-center justify-between p-4 border-b border-gray-200"
  // On mount, check for Supabase user and update Redux user state
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        dispatch(setUser({ name: data.user.email || "User" }));
      } else {
        dispatch(setUser({ name: "" }));
      }
    });
  }, []);

  // After sign-in, update Redux user state
  const handleAuthSuccess = () => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        dispatch(setUser({ name: data.user.email || "User" }));
      }
    });
    window.dispatchEvent(new Event("refreshSidebarCounts"));
    if (onAuthSuccess) onAuthSuccess();
  };

  // On sign out, clear user and orders
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    dispatch(setUser({ name: "" }));
    // Clear orders in OrdersSlice
    const event = new CustomEvent('clearOrders');
    window.dispatchEvent(event);
    window.dispatchEvent(new Event("refreshSidebarCounts"));
  };

  return (
    <>
      <header className="w-full flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900" style={{ minHeight: 64 }}>
        <div className="flex items-center gap-4">
          {/* Date Range Dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              title="Select date range"
              tabIndex={0}
              onClick={() => {
                const menu = document.getElementById("date-range-menu");
                if (menu) menu.classList.toggle("hidden");
              }}
            >
              <CalendarDays className="w-5 h-5" />
              <span className="hidden md:inline">{dateRange.label}</span>
            </button>
            <div
              id="date-range-menu"
              className="hidden absolute z-50 mt-2 w-56 right-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg p-2"
              tabIndex={-1}
            >
              {[ 
                { label: "Today", value: "today" },
                { label: "This Week", value: "week" },
                { label: "This Month", value: "month" },
                { label: "This Year", value: "year" },
                { label: "Custom Range", value: "custom" },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 ${dateRange.value === opt.value ? "bg-zinc-100 dark:bg-zinc-800 font-semibold" : ""}`}
                  onClick={() => {
                    if (opt.value !== "custom") {
                      setDateRange({ label: opt.label, value: opt.value, start: null, end: null });
                      document.getElementById("date-range-menu")?.classList.add("hidden");
                    } else {
                      setDateRange({ label: opt.label, value: opt.value, start: null, end: null });
                      // Do NOT close the menu, show the date pickers
                    }
                  }}
                >
                  {opt.label}
                </button>
              ))}
              {/* Custom Range Picker */}
              {dateRange.value === "custom" && (
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-xs text-zinc-500">Start Date</label>
                  <input
                    type="date"
                    className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                  />
                  <label className="text-xs text-zinc-500">End Date</label>
                  <input
                    type="date"
                    className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                  />
                  <button
                    className="mt-2 px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                    onClick={() => {
                      if (customStart && customEnd) {
                        setDateRange({ label: `Custom: ${customStart} to ${customEnd}`, value: "custom", start: customStart, end: customEnd });
                        document.getElementById("date-range-menu")?.classList.add("hidden");
                      }
                    }}
                  >Apply</button>
                </div>
              )}
            </div>
          </div>
          {/* Live update toggle */}
          <button
            className={`p-2 rounded-full transition ${liveUpdates ? "bg-green-100 dark:bg-green-900" : "bg-zinc-100 dark:bg-zinc-800"}`}
            title={liveUpdates ? "Live updates ON" : "Live updates OFF"}
            onClick={() => setLiveUpdates((v) => !v)}
          >
            <RefreshCcw className={`w-5 h-5 ${liveUpdates ? "text-green-600 animate-spin-slow" : "text-zinc-400"}`} />
          </button>
          {/* <span className="font-bold text-lg text-zinc-800 dark:text-zinc-100">Store Admin</span> */}
        </div>
        <div className="flex items-center gap-4">
          <button
            className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 transition group"
            onClick={() => dispatch(toggleTheme())}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark"
              ? <Sun className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300" />
              : <Moon className="w-5 h-5 text-zinc-700 group-hover:text-green-600" />}
          </button>
          <button className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 transition group" title="Notifications">
            <Bell className="w-5 h-5 text-zinc-700 dark:text-green-300 group-hover:text-green-600 dark:group-hover:text-green-400" />
          </button>
          <button className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 transition group" title="Orders">
            <ShoppingCart className="w-5 h-5 text-zinc-700 dark:text-green-300 group-hover:text-green-600 dark:group-hover:text-green-400" />
          </button>
          {user?.name ? (
            <button
              className="flex items-center gap-2 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 transition group"
              title="Sign Out"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 text-zinc-700 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300" />
              <span className="text-sm text-zinc-700 dark:text-zinc-200 group-hover:text-green-700 dark:group-hover:text-green-300">Sign Out</span>
            </button>
          ) : (
            <button
              className="flex items-center gap-2 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 transition group"
              title="User"
              onClick={() => setAuthDrawerOpen(true)}
            >
              <User className="w-5 h-5 text-zinc-700 dark:text-green-300 group-hover:text-green-600 dark:group-hover:text-green-400" />
              <span className="text-sm text-zinc-700 dark:text-zinc-200 group-hover:text-green-700 dark:group-hover:text-green-300">{user?.name || "User"}</span>
            </button>
          )}
        </div>
      </header>
  <AuthDrawer open={authDrawerOpen} onClose={() => setAuthDrawerOpen(false)} onAuthSuccess={handleAuthSuccess} />
    </>
  );
}
