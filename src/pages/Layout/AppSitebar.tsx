import { useState } from "react"
import { LayoutDashboard, Settings, ShoppingCart, Package, Users, Tag } from "lucide-react"

const menuItems = [
  // { title: "Admin Login", url: "/admin/login", icon: LogIn },
  // { title: "Admin Management", url: "/admin/users", icon: UserCog },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Products", url: "/products", icon: Package },
  { title: "Categories", url: "/categories", icon: Tag },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
  // { title: "Content", url: "/content", icon: FileText },
  // { title: "Reports & Analytics", url: "/reports", icon: BarChart2 },
  // { title: "Notifications", url: "/notifications", icon: Bell },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Sidebar content as a component for reuse
  const SidebarContent = (
    <div
      className={`h-screen ${collapsed ? "w-20" : "w-64"} bg-white text-gray-700 flex flex-col shadow-lg border-r border-gray-200 transition-all duration-300`}
    >
      {/* Top Section (Company / Logo + collapse button) */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="inline-flex w-10 h-10 bg-gray-200 rounded-full items-center justify-center font-bold">
            A
          </span>
          {!collapsed && (
            <select className="text-sm font-medium bg-transparent outline-none">
              <option>ALF Pte. Ltd.</option>
              <option>Other Org</option>
            </select>
          )}
        </div>
        <div className="flex gap-2">
          {/* Collapse button (always visible) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {collapsed ? "➡" : "⬅"}
          </button>
          {/* Close button for mobile overlay */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = item.title === "Dashboard";
          // Example badge numbers (replace with real data as needed)
          const badgeMap = {
            Orders: 12,
            Products: 8,
            Categories: 4,
            Customers: 27,
          } as const;
          const badge = badgeMap[item.title as keyof typeof badgeMap];
          return (
            <a
              key={item.title}
              href={item.url}
              className={`relative flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium group transition-all
                ${collapsed ? "justify-center" : "hover:bg-gray-100 text-gray-700"}
                ${active ? "bg-green-50 text-green-600 font-semibold" : ""}
              `}
            >
              <Icon
                className={`w-5 h-5 ${active ? "text-green-600" : "text-gray-500 group-hover:text-gray-700"}`}
              />
              {!collapsed && <span>{item.title}</span>}
              {/* Badge for specific menu items */}
              {!collapsed && badge !== undefined && (
                <span
                  className="ml-auto min-w-[20px] px-2 py-0.5 text-[11px] font-semibold 
                            bg-red-500 text-white rounded flex items-center justify-center 
                            shadow-sm tracking-tight"
                >
                  {badge}
                </span>
              )}
              {/* Tooltip for collapsed */}
              {collapsed && (
                <span
                  className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md 
                  opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
                >
                  {item.title}
                  {badge !== undefined && (
                    <span className="ml-2 bg-red-500 text-white rounded-full px-2 font-semibold">
                      {badge}
                    </span>
                  )}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* Bottom Profile */}
      <div className="p-4 border-t border-gray-200 flex items-center gap-3">
        <img
          src="https://randomuser.me/api/portraits/men/32.jpg"
          alt="User"
          className="w-10 h-10 rounded-full"
        />
        {!collapsed && (
          <div>
            <p className="text-sm font-semibold">John Doe</p>
            <p className="text-xs text-gray-500">johndoe@gmail.com</p>
          </div>
        )}
      </div>
    </div>
  );

  // Responsive rendering
  return (
    <>
      {/* Hamburger button for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-lg shadow-lg border border-gray-200"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open sidebar"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
      </button>

      {/* Sidebar overlay for mobile */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Overlay background */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close sidebar overlay"
          />
          {/* Sidebar slides in from left */}
          <div className="relative z-50">
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Sidebar for desktop */}
      <div className="hidden md:flex">
        {SidebarContent}
      </div>
    </>
  );
}
