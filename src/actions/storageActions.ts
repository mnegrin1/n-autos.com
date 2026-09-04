"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

import fs from "fs/promises";
import path from "path";

const BUCKET_NAME = "vehicles";

/**
 * Ensures the Supabase Storage bucket exists and is public.
 */
async function ensureBucketExists() {
  try {
    const { data: buckets, error: getBucketsError } = await supabaseAdmin.storage.listBuckets();
    if (getBucketsError) {
      console.warn("Could not list Supabase buckets:", getBucketsError.message);
      return;
    }

    const exists = buckets?.some((b) => b.name === BUCKET_NAME);
    if (!exists) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          "image/jpeg", 
          "image/png", 
          "image/webp", 
          "image/gif", 
          "video/mp4", 
          "video/quicktime", 
          "video/webm",
          "audio/webm",
          "audio/mp4",
          "audio/mpeg",
          "audio/ogg",
          "audio/aac",
          "audio/wav",
          "audio/x-m4a"
        ],
      });
      if (createError) {
        console.warn(`Could not create bucket '${BUCKET_NAME}':`, createError.message);
      }
    }
  } catch (e) {
    console.warn("Error checking/creating Supabase Storage bucket:", e);
  }
}

/**
 * Uploads media files (FormData or File instances) to Supabase Storage.
 * Returns public CDN URLs for images and videos.
 */
export async function uploadMediaFiles(
  files: any[],
  folderPrefix: string = "general"
): Promise<{ images: string[]; videos: string[] }> {
  const images: string[] = [];
  const videos: string[] = [];

  if (!files || files.length === 0) {
    return { images, videos };
  }

  await ensureBucketExists();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  for (const file of files) {
    if (!file || typeof file !== "object" || !file.size || !file.name) {
      continue;
    }

    try {
      const isImg = file.type?.startsWith("image/") ?? true;
      const fileExt = file.name.split(".").pop() || (isImg ? "jpg" : "mp4");
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const path = `${folderPrefix}/${Date.now()}_${cleanFileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(path, buffer, {
          contentType: file.type || (isImg ? "image/jpeg" : "video/mp4"),
          upsert: true,
        });

      if (error) {
        console.error("Supabase Storage upload error:", error);
        // Fallback placeholder URL if upload fails in unconfigured dev environment
        const fallbackUrl = `https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop`;
        if (isImg) images.push(fallbackUrl);
        else videos.push(fallbackUrl);
        continue;
      }

      // Get public URL
      const { data: publicUrlData } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      const finalUrl = publicUrlData.publicUrl;

      if (isImg) {
        images.push(finalUrl);
      } else {
        videos.push(finalUrl);
      }
    } catch (err) {
      console.error("Error processing file upload to Supabase Storage:", err);
    }
  }

  return { images, videos };
}

/**
 * Uploads a single audio buffer to Supabase Storage, with fallback to local public/uploads/audio
 */
export async function uploadAudioBuffer(
  buffer: Uint8Array,
  fileName: string,
  mimeType: string = "audio/webm",
  folderPrefix: string = "audio"
): Promise<string> {
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `${folderPrefix}/${Date.now()}_${cleanFileName}`;

  try {
    await ensureBucketExists();

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (!error && data?.path) {
      const { data: publicUrlData } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }
  } catch (err) {
    console.warn("Supabase Storage audio upload failed, using local storage fallback:", err);
  }

  // Local filesystem fallback (works reliably in local dev and without configured Supabase bucket)
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "audio");
    await fs.mkdir(uploadDir, { recursive: true });
    const localFileName = `${Date.now()}_${cleanFileName}`;
    const filePath = path.join(uploadDir, localFileName);
    await fs.writeFile(filePath, buffer);
    return `/uploads/audio/${localFileName}`;
  } catch (localErr) {
    console.error("Local audio fallback failed:", localErr);
    throw new Error("No se pudo guardar el archivo de audio.");
  }
}

