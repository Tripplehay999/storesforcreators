import { createClient } from "./supabase/client";

const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

/** Uploads an image to the user's folder in the product-images bucket and returns its public URL. */
export async function uploadImage(file: File, userId: string): Promise<string> {
  if (!ALLOWED.includes(file.type) || file.size > MAX_BYTES) {
    throw new Error("Choose a PNG, JPG, or WebP image under 2 MB.");
  }

  const supabase = createClient();
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000"
  });

  if (error) throw new Error("Upload failed. Please try again.");

  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

const MAX_FILE_BYTES = 50 * 1024 * 1024;

/**
 * Uploads the file buyers receive to the private product-files bucket (in the user's folder).
 * Nothing in that bucket is public: buyers get a short-lived signed link after paying.
 */
export async function uploadProductFile(file: File, userId: string, productId: string) {
  if (file.size > MAX_FILE_BYTES) throw new Error("Files must be under 50 MB.");

  const supabase = createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80) || "file";
  const path = `${userId}/${productId}/${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage.from("product-files").upload(path, file, {
    contentType: file.type || "application/octet-stream"
  });

  if (error) {
    throw new Error(/bucket not found/i.test(error.message)
      ? "File uploads aren't available yet. Please try again later."
      : "Upload failed. Please try again.");
  }

  return { path, fileName: file.name, sizeBytes: file.size };
}
