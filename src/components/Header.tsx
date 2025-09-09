

import { Sun, Moon, User, ShoppingCart, Bell, LogOut } from "lucide-react";
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
    if (onAuthSuccess) onAuthSuccess();
  };

  // On sign out, clear user and orders
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    dispatch(setUser({ name: "" }));
    // Clear orders in OrdersSlice
    const event = new CustomEvent('clearOrders');
    window.dispatchEvent(event);
  };

  return (
    <>
      <header className="w-full flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900" style={{ minHeight: 64 }}>
        <div className="flex items-center gap-4">
          {/* <span className="font-bold text-lg text-zinc-800 dark:text-zinc-100">Store Admin</span> */}
        </div>
        <div className="flex items-center gap-4">
          <button
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            onClick={() => dispatch(toggleTheme())}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-zinc-700" />}
          </button>
          <button className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition" title="Notifications">
            <Bell className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
          </button>
          <button className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition" title="Orders">
            <ShoppingCart className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
          </button>
          {user?.name ? (
            <button
              className="flex items-center gap-2 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              title="Sign Out"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
              <span className="text-sm text-zinc-700 dark:text-zinc-200">Sign Out</span>
            </button>
          ) : (
            <button
              className="flex items-center gap-2 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              title="User"
              onClick={() => setAuthDrawerOpen(true)}
            >
              <User className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
              <span className="text-sm text-zinc-700 dark:text-zinc-200">{user?.name || "User"}</span>
            </button>
          )}
        </div>
      </header>
  <AuthDrawer open={authDrawerOpen} onClose={() => setAuthDrawerOpen(false)} onAuthSuccess={handleAuthSuccess} />
    </>
  );
}
