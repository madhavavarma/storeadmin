import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AddProductDrawer from "./AddProductDrawer";
import type { IProduct } from "@/interfaces/IProduct";


interface ProductRow {
  id: number;
  name: string;
  ispublished?: boolean;
  price: number;
  imageUrls?: string[];
  orderCount?: number;
}

export default function Products() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortCol, setSortCol] = useState<"name" | "price" | "orders">("orders");
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      setLoading(true);
      // Fetch products
      const { data: productData } = await supabase.from("products").select("*");
      // Fetch product images
      const { data: imagesData } = await supabase.from("productimages").select("productid,url");
      // Fetch order items to compute order counts
      const { data: itemsData } = await supabase.from("order_items").select("product,quantity");

      const imagesByProduct: Record<number, string[]> = {};
      (imagesData || []).forEach((img: any) => {
        const pid = Number(img.productid);
        if (!imagesByProduct[pid]) imagesByProduct[pid] = [];
        imagesByProduct[pid].push(img.url);
      });

      // compute counts
      const counts: Record<number, number> = {};
      (itemsData || []).forEach((it: any) => {
        const prod = it.product || {};
        const pid = Number(prod.id ?? prod.productid ?? prod.product_id ?? 0);
        if (!pid) return;
        counts[pid] = (counts[pid] || 0) + (it.quantity || 1);
      });

      const rows: ProductRow[] = (productData || []).map((p: any) => ({
        id: Number(p.id),
        name: p.name,
        ispublished: p.ispublished,
        price: Number(p.price || 0),
        imageUrls: imagesByProduct[Number(p.id)] || [],
      }));

      if (!mounted) return;
      setProducts(rows);
      setLoading(false);
    }
    fetchAll();
    return () => {
      mounted = false;
    };
  }, []);

  async function setPublished(productId: number, publish: boolean) {
    try {
      const { error } = await supabase.from('products').update({ ispublished: publish }).eq('id', productId);
      if (error) {
        console.error(publish ? 'Publish failed' : 'Unpublish failed', error);
        return;
      }
      setProducts((prev) => prev.map(p => p.id === productId ? { ...p, ispublished: publish } : p));
    } catch (err) {
      console.error('Error updating publish status:', err);
    }
  }

  async function handleAddProduct(data: Partial<IProduct>) {
    // Insert product into Supabase
    const { data: inserted, error } = await supabase.from("products").insert({
      name: data.name,
      price: data.price,
      category: data.category,
      labels: data.labels,
      ispublished: data.ispublished,
      discount: data.discount,
      tax: data.tax,
    }).select().single();
    if (error) {
      alert("Error adding product: " + error.message);
      return;
    }
    // Insert images if present
    if (data.imageUrls && data.imageUrls.length > 0) {
      for (const url of data.imageUrls) {
        await supabase.from("productimages").insert({
          productid: inserted.id,
          url,
        });
      }
    }
    // Insert product descriptions if present
    if (data.productdescriptions && data.productdescriptions.length > 0) {
      for (const desc of data.productdescriptions) {
        await supabase.from("productdescriptions").insert({
          productid: inserted.id,
          title: desc.title,
          content: desc.content,
        });
      }
    }
    // Insert variants and options if present
    if (data.productvariants && data.productvariants.length > 0) {
      for (const variant of data.productvariants) {
        const { id, ...variantInsert } = variant; // omit id
        const { data: variantRow, error: variantError } = await supabase.from("productvariants").insert({
          productid: inserted.id,
          name: variantInsert.name,
          ispublished: variantInsert.ispublished,
        }).select().single();
        if (variantError || !variantRow) continue;
        if (variant.productvariantoptions && variant.productvariantoptions.length > 0) {
          for (const option of variant.productvariantoptions) {
            const { id: optId, ...optionInsert } = option; // omit id
            await supabase.from("productvariantoptions").insert({
              variantid: variantRow.id,
              name: optionInsert.name,
              price: optionInsert.price,
              ispublished: optionInsert.ispublished,
              isoutofstock: optionInsert.isoutofstock,
              isdefault: optionInsert.isdefault,
            });
          }
        }
      }
    }
    // Reload the product with relations to ensure UI is up to date
    const { data: fullProduct } = await supabase
      .from("products")
      .select(`*, productimages(url)`) // add more relations if needed
      .eq("id", inserted.id)
      .single();
    setProducts((prev) => [...prev, { ...fullProduct, imageUrls: (fullProduct?.productimages || []).map((img: any) => img.url) }]);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
        <svg className="animate-spin h-8 w-8 text-green-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
        <span className="text-green-700 font-medium text-lg">Loading products...</span>
      </div>
    );
  }

  // filtering + sorting
  const filtered = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  const sorted = filtered.sort((a,b) => {
    let aVal: any = a[sortCol === 'orders' ? 'orderCount' : sortCol];
    let bVal: any = b[sortCol === 'orders' ? 'orderCount' : sortCol];
    if (aVal == null) aVal = 0;
    if (bVal == null) bVal = 0;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    return 0;
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paginated = sorted.slice((currentPage-1)*perPage, currentPage*perPage);

  // top 4 by orderCount
  const top4 = [...products].sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0)).slice(0, 4);

  return (
    <div className="p-2 md:p-6 space-y-4 md:space-y-8 pb-24 md:pb-0">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {top4.map((prod, idx) => (
          <div
            key={prod.id}
            className="rounded-2xl p-4 shadow-sm cursor-pointer transition hover:shadow-md border flex flex-col items-center justify-center text-center bg-gradient-to-tr from-green-50 to-white dark:from-zinc-900 dark:to-zinc-800 animate-fadein-slideup"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className={`p-3 rounded-md bg-lime-50 dark:bg-zinc-800 dark:text-green-300 mb-3`}>
              <Package className="w-6 h-6" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-200">{prod.name}</span>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{prod.orderCount || 0}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 w-full md:w-1/2">
          <Input placeholder="Search products..." value={query} onChange={(e:any)=>{setQuery(e.target.value); setCurrentPage(1)}} />
          <select value={sortCol} onChange={(e)=>setSortCol(e.target.value as any)} className="rounded-md border px-2 py-1 text-sm">
            <option value="orders">Sort by Orders</option>
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
          </select>
          <select value={sortDir} onChange={(e)=>setSortDir(e.target.value as any)} className="rounded-md border px-2 py-1 text-sm">
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddOpen(true)} className="bg-green-600 text-white">+ Add Product</Button>
        </div>
      </div>

      {/* Desktop Table */}
  <div className="hidden md:block bg-white dark:bg-zinc-900 shadow-sm rounded-xl p-4 border border-gray-200 dark:border-zinc-800 overflow-x-auto">
        <table className="w-full text-sm border-collapse rounded-xl shadow-md overflow-hidden bg-white dark:bg-zinc-900">
          <thead>
            <tr className="bg-green-50 dark:bg-zinc-800 text-left text-gray-600 dark:text-gray-200">
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((p) => (
              <tr key={p.id} className="border-b hover:bg-green-50 dark:hover:bg-zinc-800">
                <td className="p-3 align-top flex items-center gap-3">
                  <img src={p.imageUrls?.[0] || "/vite.svg"} alt={p.name} className="h-12 w-12 rounded-md object-cover" />
                  <div className="truncate">
                    <div className="font-medium text-gray-800 dark:text-gray-200">{p.name}</div>
                  </div>
                </td>
                <td className="p-3 align-top">₹{p.price}</td>
                <td className="p-3 align-top">
                  <div className="flex items-center gap-2">
                    {p.ispublished ? (
                      <Button size="sm" className="bg-red-600 text-white" onClick={() => setPublished(p.id, false)}>Unpublish</Button>
                    ) : (
                      <Button size="sm" className="bg-green-600 text-white" onClick={() => setPublished(p.id, true)}>Publish</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-2 gap-3 md:hidden pb-6">
        {paginated.map((p, idx) => (
          <div key={p.id} className="rounded-2xl p-3 shadow-md cursor-pointer transition hover:shadow-lg border border-green-100 dark:border-zinc-800 flex flex-col justify-center text-center bg-white dark:bg-zinc-900 animate-fadein-slideup min-h-[120px]" style={{ animationDelay: `${idx * 60}ms` }}>
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-1">{p.name}</span>
            <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mt-1">₹{p.price}</div>
            <div className="text-xs text-gray-500 mt-1">Orders: {p.orderCount || 0}</div>
          </div>
        ))}
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <Button variant="outline" size="sm" disabled={currentPage===1} onClick={()=>setCurrentPage((p)=>Math.max(1,p-1))}><ChevronLeft size={16} /> Previous</Button>
        <span>Page {currentPage} of {totalPages}</span>
        <Button variant="outline" size="sm" disabled={currentPage===totalPages} onClick={()=>setCurrentPage((p)=>Math.min(totalPages,p+1))}>Next <ChevronRight size={16} /></Button>
      </div>

      {/* Add Product Drawer */}
      <AddProductDrawer open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAddProduct} />
    </div>
  );
}
