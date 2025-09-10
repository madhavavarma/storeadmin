import { useState, useRef } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/supabaseClient";

interface AddCategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; image_url: string; is_published: boolean }) => void;
}

export default function AddCategoryDrawer({ open, onClose, onAdd }: AddCategoryDrawerProps) {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [filePath, setFilePath] = useState<string | null>(null); // for deletion if needed
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let finalImageUrl = imageUrl;
    let uploadedFilePath = filePath;
    if (selectedFile) {
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { error } = await supabase.storage.from("storeadmin").upload(fileName, selectedFile, { upsert: false });
      if (error) {
        alert("Image upload failed");
        setLoading(false);
        return;
      }
      uploadedFilePath = fileName;
      finalImageUrl = supabase.storage.from("storeadmin").getPublicUrl(fileName).data.publicUrl;
    }

    await onAdd({ name, image_url: finalImageUrl, is_published: isPublished });

    setLoading(false);
    setName("");
    setImageUrl("");
    setFilePath(null);
    setSelectedFile(null);
    setIsPublished(true);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setImageUrl(""); // clear preview until upload
    setFilePath(null);
  };

  const handleDeleteImage = async () => {
  if (!filePath) return;

  const { data, error } = await supabase.storage.from("storeadmin").remove([filePath]);

  if (error) {
    return;
  }

  setImageUrl("");
  setFilePath(null);
  if (fileInputRef.current) fileInputRef.current.value = "";
};

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Add New Category</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
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
                    onClick={() => { setSelectedFile(null); setImageUrl(""); setFilePath(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <Input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              )}
            </>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              id="isPublished"
            />
            <label htmlFor="isPublished" className="text-sm">
              Published
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading || uploading}
            className="w-full"
          >
            {loading ? "Adding..." : "Add Category"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
