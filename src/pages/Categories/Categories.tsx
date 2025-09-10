import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ICategory } from "@/interfaces/ICategory"
import { getCategories } from "../api"
import AddCategoryDrawer from "./AddCategoryDrawer"
import EditCategoryDrawer from "./EditCategoryDrawer"
import { supabase } from "@/supabaseClient"


export default function Categories({ refreshKey: parentRefreshKey }: { refreshKey: number }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const perPage = 6;
  const totalPages = Math.ceil(categories.length / perPage);

  useEffect(() => {
    setLoading(true);
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setIsLoggedIn(true);
        getCategories()
          .then((data) => {
            setCategories(data || []);
            setLoading(false);
          })
          .catch(() => {
            setError("Failed to load categories");
            setLoading(false);
          });
      } else {
        setIsLoggedIn(false);
        setCategories([]);
        setLoading(false);
      }
    });
    // Listen for signout event to clear categories
    const clear = () => setCategories([]);
    window.addEventListener("clearOrders", clear);
    return () => window.removeEventListener("clearOrders", clear);
  }, [refreshKey, drawerOpen, parentRefreshKey]);

  const paginated = categories.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleRowClick = (category: ICategory) => {
    setSelectedCategory(category);
    setEditDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
        <svg className="animate-spin h-8 w-8 text-green-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <span className="text-green-700 font-medium text-lg">Loading categories...</span>
      </div>
    );
  }
  if (isLoggedIn === false) {
    return <div className="p-8 text-center text-gray-500">Please log in to view categories.</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }
  return (
    <div className="p-4 space-y-6">
      {/* Top Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {categories.slice(0, 4).map((cat) => (
          <div
            key={cat.id}
            className="rounded-2xl p-4 shadow-sm cursor-pointer transition hover:shadow-md border flex flex-col items-center justify-center text-center bg-green-50 dark:bg-zinc-900"
            onClick={() => handleRowClick(cat)}
          >
            <img
              src={cat.image_url}
              alt={cat.name}
              className="h-16 w-16 object-contain mb-3"
            />
            <p className="text-sm font-semibold text-gray-700 dark:text-green-200">{cat.name}</p>
          </div>
        ))}
      </div>

      {/* Categories List */}
  <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
          <h2 className="text-lg font-semibold">All Categories List</h2>
          <Button
            variant="default"
            size="sm"
            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white border-green-700"
            onClick={() => setDrawerOpen(true)}
          >
            + Add New
          </Button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white dark:bg-zinc-900 shadow-sm rounded-xl p-4 border border-gray-200 dark:border-zinc-800 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-green-50 dark:bg-zinc-800 text-left text-gray-600 dark:text-gray-200">
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium">Published</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((cat) => (
                <tr
                  key={cat.id}
                  className={"border-b hover:bg-green-50 dark:hover:bg-zinc-800 cursor-pointer transition bg-white dark:bg-zinc-900"}
                  onClick={() => handleRowClick(cat)}
                >
                  <td className="p-3 flex items-center gap-3 align-top">
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="h-10 w-10 rounded-md object-contain border"
                    />
                    <span className="font-medium text-gray-800 dark:text-green-200">{cat.name}</span>
                  </td>
                  <td className="p-3 align-top">
                    {cat.is_published ? (
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-md shadow-sm transition border border-green-400 text-green-700 bg-green-50 dark:bg-green-900 dark:text-green-200 dark:border-green-700">
                        Published
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-md shadow-sm transition border border-red-400 text-red-600 bg-red-50 dark:bg-red-900 dark:text-red-200 dark:border-red-700">
                        Unpublished
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="grid md:hidden gap-3">
          {paginated.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 p-3 rounded-xl border shadow-sm hover:bg-green-50 cursor-pointer transition"
              onClick={() => handleRowClick(cat)}
            >
              <img
                src={cat.image_url}
                alt={cat.name}
                className="h-12 w-12 object-contain rounded-md border"
              />
              <div>
                <p className="font-medium text-gray-700">{cat.name}</p>
                <p
                  className={`text-xs mt-1 ${
                    cat.is_published ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {cat.is_published ? "Published" : "Unpublished"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
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
        <AddCategoryDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onAdd={async (data) => {
            await supabase.from("categories").insert([data]);
            setDrawerOpen(false);
            setRefreshKey((k) => k + 1);
          }}
        />
        <EditCategoryDrawer
          open={editDrawerOpen}
          onClose={() => setEditDrawerOpen(false)}
          category={selectedCategory}
          onUpdate={async (data) => {
            if (!data.id) return;
            const { id, ...rest } = data;
            // If image_url is different from selectedCategory.image_url, delete old image
            if (selectedCategory && data.image_url && data.image_url !== selectedCategory.image_url && selectedCategory.image_url) {
              const splitStr = '/object/public/storeadmin/';
              const idx = selectedCategory.image_url.indexOf(splitStr);
              let path = '';
              if (idx !== -1) {
                path = selectedCategory.image_url.substring(idx + splitStr.length);
                await supabase.storage.from('storeadmin').remove([path]);
              }
            }
            await supabase.from("categories").update(rest).eq("id", id);
            setEditDrawerOpen(false);
            setSelectedCategory(null);
            setRefreshKey((k) => k + 1);
          }}
          onDelete={async (id, image_url) => {
            // Remove category reference from products
            const cat = categories.find(c => c.id === id);
            if (cat) {
              await supabase.from("products").update({ category: "" }).eq("category", cat.name);
            }
            await supabase.from("categories").delete().eq("id", id);
            // Remove image from storage if present
            if (image_url) {
              const splitStr = '/object/public/storeadmin/';
              const idx = image_url.indexOf(splitStr);
              let path = '';
              if (idx !== -1) {
                path = image_url.substring(idx + splitStr.length);
                await supabase.storage.from('storeadmin').remove([path]);
              }
            }
            setEditDrawerOpen(false);
            setSelectedCategory(null);
            setRefreshKey((k) => k + 1);
          }}
        />
        </div>
      </div>
    
  );
}
