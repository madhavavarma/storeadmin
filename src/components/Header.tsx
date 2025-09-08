
import { Sun, Moon, User, ShoppingCart, Bell } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/Store";
import { toggleTheme } from "@/store/HeaderSlice";
import { useEffect } from "react";

export default function Header() {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.header.theme);
  const user = useSelector((state: RootState) => state.header.user);

  // Add or remove dark mode class on html element
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);
  // Sidebar header: className="flex items-center justify-between p-4 border-b border-gray-200"
  return (
    <header className="w-full flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 dark:bg-gray-900" style={{ minHeight: 64 }}>
      <div className="flex items-center gap-4">
        <span className="font-bold text-lg text-gray-800 dark:text-gray-100">Store Admin</span>
      </div>
      <div className="flex items-center gap-4">
        <button
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          onClick={() => dispatch(toggleTheme())}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition" title="Notifications">
          <Bell className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition" title="Orders">
          <ShoppingCart className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          <span className="text-sm text-gray-700 dark:text-gray-200">{user?.name || "User"}</span>
        </div>
      </div>
    </header>
  );
}
