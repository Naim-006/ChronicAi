import { createClient, isSupabaseConfigured } from "./client";

export const STORAGE_BUCKETS = {
  MEDICAL_RECORDS: "medical-records",
  AVATARS: "avatars",
} as const;

export interface StorageUploadResult {
  path: string;
  url?: string;
  error?: string;
}

/**
 * Uploads an encrypted medical document to the user's private storage folder.
 */
export async function uploadMedicalDocument(
  file: File,
  userId: string
): Promise<StorageUploadResult> {
  if (!isSupabaseConfigured()) {
    // Return simulated success path for demo/offline mode
    return {
      path: `demo/${userId}/${Date.now()}_${file.name}`,
      url: URL.createObjectURL(file),
    };
  }

  const supabase = createClient();
  const fileExt = file.name.split(".").pop();
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `${userId}/${Date.now()}_${cleanName}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.MEDICAL_RECORDS)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "application/pdf",
    });

  if (error) {
    return { path: "", error: error.message };
  }

  return { path: data.path };
}

/**
 * Generates a secure, temporary signed URL to view a private medical record.
 */
export async function getMedicalDocumentSignedUrl(
  filePath: string,
  expiresIn = 3600
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return filePath.startsWith("http") ? filePath : null;
  }

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.MEDICAL_RECORDS)
    .createSignedUrl(filePath, expiresIn);

  if (error || !data) {
    return null;
  }

  return data.signedUrl;
}

/**
 * Uploads a profile avatar and returns its publicly accessible URL.
 */
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<StorageUploadResult> {
  if (!isSupabaseConfigured()) {
    return {
      path: `avatars/${userId}`,
      url: URL.createObjectURL(file),
    };
  }

  const supabase = createClient();
  const fileExt = file.name.split(".").pop() || "png";
  const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.AVATARS)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    return { path: "", error: error.message };
  }

  const { data: publicData } = supabase.storage
    .from(STORAGE_BUCKETS.AVATARS)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    url: publicData.publicUrl,
  };
}
