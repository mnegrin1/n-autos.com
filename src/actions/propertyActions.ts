"use server";

import { getDb, saveDb } from "@/lib/localDb";
import { revalidatePath } from "next/cache";

import { supabase } from "@/lib/supabase";
import { propertySchema } from "@/lib/schemas";

const isSupabaseActive = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && !url.includes("mock-project") && key && !key.includes("mock-anon-key"));
};

// Helper para guardar archivos subidos físicamente en public/uploads/ y clasificarlos
async function saveUploadedFiles(files: any[]): Promise<{ images: string[], videos: string[] }> {
  const images: string[] = [];
  const videos: string[] = [];

  let fsModule: any = null;
  let pathModule: any = null;

  if (typeof window === 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
    try {
      fsModule = require("fs/promises");
      pathModule = require("path");
      
      const uploadDir = pathModule.join(process.cwd(), "public", "uploads");
      await fsModule.mkdir(uploadDir, { recursive: true });

      for (const file of files) {
        if (file && typeof file === "object" && file.size > 0 && file.name) {
          try {
            const isImg = file.type.startsWith("image/");
            const prefix = isImg ? "img" : "vid";
            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = `${Date.now()}-${prefix}-${file.name.replace(/\s+/g, "-")}`;
            const filePath = pathModule.join(uploadDir, filename);
            await fsModule.writeFile(filePath, buffer);
            
            const relativePath = `/uploads/${filename}`;
            if (isImg) {
              images.push(relativePath);
            } else {
              videos.push(relativePath);
            }
          } catch (err) {
            console.error("Error guardando archivo multimedia:", err);
          }
        }
      }
    } catch (e) {
      console.error("Error loading fs/path in propertyActions:", e);
    }
  }

  return { images, videos };
}

export async function getProperties(agencyId: string) {
  if (isSupabaseActive()) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false });
      if (!error && data) {
        return data as any[];
      }
    } catch (e) {
      console.error("Supabase getProperties error:", e);
    }
  }
  const db = getDb();
  return db.properties.filter((p) => p.agency_id === agencyId);
}

export async function getPropertyById(propertyId: string) {
  if (isSupabaseActive()) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .maybeSingle();
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.error("Supabase getPropertyById error:", e);
    }
  }
  const db = getDb();
  return db.properties.find((p) => p.id === propertyId) || null;
}

export async function createProperty(formData: FormData) {
  // Validate basic fields using Zod
  const rawFields = {
    title: formData.get("title") as string,
    type: formData.get("type") as any,
    operation: formData.get("operation") as any,
    price: Number(formData.get("price")),
    currency: (formData.get("currency") as string) || "USD",
    bedrooms: formData.get("bedrooms") ? Number(formData.get("bedrooms")) : null,
    bathrooms: formData.get("bathrooms") ? Number(formData.get("bathrooms")) : null,
    description: formData.get("description") as string || "",
    status: (formData.get("status") as string) || "disponible",
    latitude: formData.get("latitude") ? Number(formData.get("latitude")) : null,
    longitude: formData.get("longitude") ? Number(formData.get("longitude")) : null,
    polygon: formData.get("polygon") as string || null,
  };

  const validationResult = propertySchema.safeParse(rawFields);
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten().fieldErrors };
  }

  const validatedData = validationResult.data;

  // Process uploaded files
  const media = formData.getAll("media");
  const { images: uploadedImages, videos: uploadedVideos } = await saveUploadedFiles(media);

  let finalImages = [...uploadedImages];
  let finalVideos = [...uploadedVideos];
  let youtubeVideosField: string | null = null;

  const mediaLayoutRaw = formData.get("media_layout") as string;
  if (mediaLayoutRaw) {
    try {
      const layout = JSON.parse(mediaLayoutRaw);
      if (Array.isArray(layout)) {
        const imgQueue = [...uploadedImages];
        const vidQueue = [...uploadedVideos];

        const unifiedMedia = layout.map((item: any) => {
          if (item.kind === "youtube") {
            return { type: "youtube", url: item.url, embedId: item.embedId };
          }
          if (item.kind === "file") {
            if (item.fileType === "video") {
              const url = vidQueue.shift();
              return url ? { type: "video", url } : null;
            } else {
              const url = imgQueue.shift();
              return url ? { type: "image", url } : null;
            }
          }
          return null;
        }).filter(Boolean);

        youtubeVideosField = JSON.stringify(unifiedMedia);

        // Reconstruct sorted order for main images/videos arrays
        finalImages = unifiedMedia
          .filter((item: any) => item.type === "image")
          .map((item: any) => item.url)
          .filter(Boolean) as string[];
        finalVideos = unifiedMedia
          .filter((item: any) => item.type === "video")
          .map((item: any) => item.url)
          .filter(Boolean) as string[];
      }
    } catch (e) {
      console.error("Error parsing media_layout:", e);
    }
  }

  if (finalImages.length === 0) {
    finalImages = ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"];
  }

  if (isSupabaseActive()) {
    try {
      const { data, error } = await supabase
        .from("properties")
        .insert({
          agency_id: "00000000-0000-0000-0000-000000000000",
          title: validatedData.title,
          type: validatedData.type,
          operation: validatedData.operation,
          price: validatedData.price,
          currency: validatedData.currency,
          bedrooms: validatedData.bedrooms,
          bathrooms: validatedData.bathrooms,
          description: validatedData.description,
          images: finalImages,
          videos: finalVideos,
          latitude: validatedData.latitude,
          longitude: validatedData.longitude,
          polygon: validatedData.polygon,
          youtube_videos: youtubeVideosField,
          status: validatedData.status,
        } as any)
        .select()
        .single();

      if (!error && data) {
        revalidatePath("/realstate/admin/properties");
        revalidatePath(`/realstate/portal/[agency]`, 'layout');
        return { success: true, data };
      } else {
        console.error("Supabase insert property error:", error);
      }
    } catch (e) {
      console.error("Supabase createProperty error:", e);
    }
  }

  const db = getDb();
  const newProperty = {
    id: `prop-${Date.now()}`,
    agency_id: "demo-agency-id",
    title: validatedData.title,
    type: validatedData.type,
    operation: validatedData.operation,
    price: validatedData.price,
    currency: validatedData.currency,
    bedrooms: validatedData.bedrooms,
    bathrooms: validatedData.bathrooms,
    description: validatedData.description,
    images: finalImages,
    videos: finalVideos,
    latitude: validatedData.latitude,
    longitude: validatedData.longitude,
    polygon: validatedData.polygon,
    youtube_videos: youtubeVideosField,
    status: validatedData.status,
    created_at: new Date().toISOString(),
  };

  db.properties.unshift(newProperty);
  saveDb(db);

  revalidatePath("/realstate/admin/properties");
  revalidatePath(`/realstate/portal/[agency]`, 'layout');
  
  return { success: true, data: newProperty };
}

export async function updateProperty(propertyId: string, formData: FormData) {
  // Validate basic fields using Zod
  const rawFields = {
    title: formData.get("title") as string,
    type: formData.get("type") as any,
    operation: formData.get("operation") as any,
    price: Number(formData.get("price")),
    currency: (formData.get("currency") as string) || "USD",
    bedrooms: formData.get("bedrooms") ? Number(formData.get("bedrooms")) : null,
    bathrooms: formData.get("bathrooms") ? Number(formData.get("bathrooms")) : null,
    description: formData.get("description") as string || "",
    status: (formData.get("status") as string) || "disponible",
    latitude: formData.get("latitude") ? Number(formData.get("latitude")) : null,
    longitude: formData.get("longitude") ? Number(formData.get("longitude")) : null,
    polygon: formData.get("polygon") as string || null,
  };

  const validationResult = propertySchema.safeParse(rawFields);
  if (!validationResult.success) {
    return { success: false, error: validationResult.error.flatten().fieldErrors };
  }

  const validatedData = validationResult.data;

  // Process new file uploads
  const media = formData.getAll("media");
  const { images: newImages, videos: newVideos } = await saveUploadedFiles(media);

  // Read existing (kept) images/videos from the form
  let keptImages: string[] = [];
  let keptVideos: string[] = [];
  try {
    const existingImagesRaw = formData.get("existing_images") as string;
    if (existingImagesRaw) keptImages = JSON.parse(existingImagesRaw);
  } catch {}
  try {
    const existingVideosRaw = formData.get("existing_videos") as string;
    if (existingVideosRaw) keptVideos = JSON.parse(existingVideosRaw);
  } catch {}

  // Merge: kept existing + newly uploaded
  const finalImages = [...keptImages, ...newImages];
  const finalVideos = [...keptVideos, ...newVideos];

  // Reconstruct unified media layout if present
  let youtubeVideosField: string | null = null;
  const mediaLayoutRaw = formData.get("media_layout") as string;

  let resolvedImages = finalImages;
  let resolvedVideos = finalVideos;

  if (mediaLayoutRaw) {
    try {
      const layout = JSON.parse(mediaLayoutRaw);
      if (Array.isArray(layout)) {
        const imgQueue = [...newImages];
        const vidQueue = [...newVideos];

        const unifiedMedia = layout.map((item: any) => {
          if (item.kind === "existing") {
            return { type: item.isVideo ? "video" : "image", url: item.url };
          }
          if (item.kind === "youtube") {
            return { type: "youtube", url: item.url, embedId: item.embedId };
          }
          if (item.kind === "file") {
            if (item.fileType === "video") {
              const url = vidQueue.shift();
              return url ? { type: "video", url } : null;
            } else {
              const url = imgQueue.shift();
              return url ? { type: "image", url } : null;
            }
          }
          return null;
        }).filter(Boolean);

        youtubeVideosField = JSON.stringify(unifiedMedia);

        // Reconstruct exact user-defined sorted array of images and videos
        resolvedImages = unifiedMedia
          .filter((item: any) => item.type === "image")
          .map((item: any) => item.url)
          .filter(Boolean) as string[];
        resolvedVideos = unifiedMedia
          .filter((item: any) => item.type === "video")
          .map((item: any) => item.url)
          .filter(Boolean) as string[];
      }
    } catch (e) {
      console.error("Error parsing media_layout in update:", e);
    }
  } else {
    // Legacy fallback if no media_layout sent (e.g. from automatic scripts or old client forms)
    youtubeVideosField = formData.get("youtube_videos") as string || null;
  }

  // If nothing at all, fall back to existing property data
  let existingProperty: any = null;
  if (isSupabaseActive()) {
    try {
      const { data } = await supabase.from("properties").select("*").eq("id", propertyId).maybeSingle();
      existingProperty = data;
    } catch {}
  }
  if (!existingProperty) {
    const db = getDb();
    existingProperty = db.properties.find((p) => p.id === propertyId);
  }

  if (!existingProperty) {
    return { success: false, error: "Propiedad no encontrada" };
  }

  // If no images resolved, fall back to existing ones
  if (resolvedImages.length === 0 && existingProperty) {
    resolvedImages = existingProperty.images;
  }
  if (resolvedVideos.length === 0 && existingProperty) {
    resolvedVideos = existingProperty.videos;
  }

  const updatedFields = {
    title: validatedData.title,
    type: validatedData.type,
    operation: validatedData.operation,
    price: validatedData.price,
    currency: validatedData.currency,
    bedrooms: validatedData.bedrooms,
    bathrooms: validatedData.bathrooms,
    description: validatedData.description,
    images: resolvedImages,
    videos: resolvedVideos,
    latitude: validatedData.latitude,
    longitude: validatedData.longitude,
    polygon: validatedData.polygon,
    youtube_videos: youtubeVideosField,
    status: validatedData.status,
  };

  if (isSupabaseActive()) {
    try {
      const { data, error } = await (supabase.from("properties") as any)
        .update(updatedFields as any)
        .eq("id", propertyId)
        .select()
        .single();

      if (!error && data) {
        revalidatePath("/realstate/admin");
        revalidatePath("/realstate/admin/properties");
        revalidatePath(`/realstate/admin/properties/edit/${propertyId}`);
        revalidatePath(`/realstate/portal/[agency]`, 'layout');
        revalidatePath(`/realstate/portal/[agency]/${propertyId}`);
        return { success: true, data };
      }
    } catch (e) {
      console.error("Supabase updateProperty error:", e);
    }
  }

  const db = getDb();
  const index = db.properties.findIndex((p) => p.id === propertyId);
  if (index !== -1) {
    db.properties[index] = {
      ...existingProperty,
      ...updatedFields,
    };

    saveDb(db);

    revalidatePath("/realstate/admin");
    revalidatePath("/realstate/admin/properties");
    revalidatePath(`/realstate/admin/properties/edit/${propertyId}`);
    revalidatePath(`/realstate/portal/[agency]`, 'layout');
    revalidatePath(`/realstate/portal/[agency]/${propertyId}`);

    return { success: true, data: db.properties[index] };
  }

  return { success: false, error: "Propiedad no encontrada" };
}
