import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ICategory } from "@/interfaces/ICategory"
import { getCategories } from "../api"
import { supabase } from "@/supabaseClient"


export default function Categories({ refreshKey }: { refreshKey: number }) {

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
  }, [refreshKey]);

  const paginated = categories.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleRowClick = (category: ICategory) => {
    // TODO: open side drawer with category details
    console.log("Clicked category:", category);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading categories...</div>;
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
            className="rounded-2xl p-4 shadow-sm cursor-pointer transition hover:shadow-md border flex flex-col items-center justify-center text-center bg-gradient-to-tr from-green-50 to-white"
            onClick={() => handleRowClick(cat)}
          >
            <img
              src={cat.image_url}
              alt={cat.name}
              className="h-16 w-16 object-contain mb-3"
            />
            <p className="text-sm font-semibold text-gray-700">{cat.name}</p>
          </div>
        ))}
      </div>

      {/* Categories List */}
      <div className="bg-white shadow-sm rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-3">All Categories List</h2>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-green-50 text-left text-gray-600">
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium">Published</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b hover:bg-green-50 cursor-pointer transition"
                  onClick={() => handleRowClick(cat)}
                >
                  <td className="p-3 flex items-center gap-3">
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="h-10 w-10 rounded-md object-contain border"
                    />
                    <span className="font-medium">{cat.name}</span>
                  </td>
                  <td className="p-3">
                    {cat.is_published ? (
                      <span className="px-2 py-1 text-xs border border-green-400 text-green-600 bg-green-50 rounded-md">
                        Published
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs border border-red-400 text-red-600 bg-red-50 rounded-md">
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
        <div className="flex items-center justify-center gap-2 mt-4">
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
  );
}
