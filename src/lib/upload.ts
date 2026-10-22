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
