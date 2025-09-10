import React, { useState, useRef } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { supabase } from "@/supabaseClient";
import type { ICategory } from "@/interfaces/ICategory";

interface EditCategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  category: ICategory | null;
  onUpdate: (data: Partial<ICategory>) => void;
  onDelete: (id: number, image_url: string) => void;
}

export default function EditCategoryDrawer({ open, onClose, category, onUpdate, onDelete }: EditCategoryDrawerProps) {
  const [name, setName] = useState(category?.name || "");
  const [imageUrl, setImageUrl] = useState(category?.image_url || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPublished, setIsPublished] = useState(category?.is_published ?? true);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update state when category changes
  React.useEffect(() => {
    setName(category?.name || "");
    setImageUrl(category?.image_url || "");
    setIsPublished(category?.is_published ?? true);
    setSelectedFile(null);
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let finalImageUrl = imageUrl;
    if (selectedFile) {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { error } = await supabase.storage.from("storeadmin").upload(fileName, selectedFile, { upsert: false });
      if (error) {
        alert("Image upload failed");
        setLoading(false);
        return;
      }
      finalImageUrl = supabase.storage.from("storeadmin").getPublicUrl(fileName).data.publicUrl;
    }
    onUpdate({ id: category?.id, name, image_url: finalImageUrl, is_published: isPublished });
    setLoading(false);
    onClose();
  };

  const [confirmOpen, setConfirmOpen] = useState(false);
  const handleDelete = async () => {
    setConfirmOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!category) return;
    // Remove image from storage if present
    if (category.image_url) {
      const splitStr = '/object/public/storeadmin/';
      const idx = category.image_url.indexOf(splitStr);
      let path = '';
      if (idx !== -1) {
        path = category.image_url.substring(idx + splitStr.length);
        await supabase.storage.from('storeadmin').remove([path]);
      }
    }
    onDelete(category.id, category.image_url);
    setConfirmOpen(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Edit Category</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Category name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image</label>
            <>
              {selectedFile ? (
                <div className="flex flex-col gap-2 items-start">
                  <span className="text-xs text-gray-700">{selectedFile.name}</span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => { setSelectedFile(null); setImageUrl(category?.image_url || ""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <>
                  {imageUrl && (
                    <img src={imageUrl} alt="Category" className="h-20 w-20 object-contain border rounded-md mb-2" />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={e => { const file = e.target.files?.[0]; if (file) setSelectedFile(file); }}
                  />
                </>
              )}
            </>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={e => setIsPublished(e.target.checked)}
              id="isPublishedEdit"
            />
            <label htmlFor="isPublishedEdit" className="text-sm">Published</label>
          </div>
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white border-green-700" variant="default">{loading ? "Updating..." : "Update Category"}</Button>
            <Button type="button" variant="destructive" onClick={handleDelete} className="w-full">Delete</Button>
          </div>
          <ConfirmDialog
            open={confirmOpen}
            title="Delete Category?"
            description="Are you sure you want to delete this category? This action cannot be undone."
            confirmText="Yes, Delete"
            cancelText="Cancel"
            onConfirm={handleConfirmDelete}
            onCancel={() => setConfirmOpen(false)}
          />
        </form>
      </SheetContent>
    </Sheet>
  );
}
