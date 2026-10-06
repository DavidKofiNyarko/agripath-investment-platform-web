import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

export const supabase = createBrowserClient(supabaseUrl, supabaseKey);

export async function uploadImageToSupabase(
  bucketName: string,
  file: File,
  filePath: string
) {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, { upsert: false }); // upsert: false to avoid overwriting

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get the public URL for the uploaded file
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}
