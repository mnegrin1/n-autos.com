"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { vehicleSchema, autoLeadSchema } from "@/lib/schemas";

// Helper to save files to public/uploads
async function saveUploadedFiles(files: any[]): Promise<{ images: string[], videos: string[] }> {
  const images: string[] = [];
  const videos: string[] = [];

  let fsModule: any = null;
  let pathModule: any = null;
  if (typeof window === 'undefined' && process.env.NEXT_RUNTIME !== 'edge' && typeof process !== 'undefined' && typeof process.cwd === 'function') {
    try {
      fsModule = require('fs/promises');
      pathModule = require('path');
      
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
            console.error("Error saving vehicle multimedia file:", err);
          }
        }
      }
    } catch (e) {
      console.error("Error writing files in autoActions:", e);
    }
  }

  if (!fsModule || !pathModule) {
    console.log("No filesystem access in Edge Runtime, skipping local file write.");
  }

  return { images, videos };
}

export async function getVehicles(agencyId: string) {
  const { data, error } = await (supabase.from('vehicles') as any).select('*').eq('agency_id', agencyId);
  if (error) {
    console.error("Error fetching vehicles:", error);
    return [];
  }
  return data || [];
}

export async function getVehicleById(vehicleId: string) {
  const { data, error } = await (supabase.from('vehicles') as any).select('*').eq('id', vehicleId).single();
  if (error) {
    console.error("Error fetching vehicle by id:", error);
    return null;
  }
  return data;
}

export async function createVehicle(formData: FormData) {
  const rawFields = {
    brand: formData.get("brand") as string,
    model: formData.get("model") as string,
    year: Number(formData.get("year")),
    kms: Number(formData.get("kms")),
    transmission: formData.get("transmission") as any,
    fuel: formData.get("fuel") as any,
    price: Number(formData.get("price")),
    currency: (formData.get("currency") as string) || "USD",
    color: formData.get("color") as string || "",
    engine: formData.get("engine") as string || "",
    doors: formData.get("doors") ? Number(formData.get("doors")) : null,
    plate: formData.get("plate") as string || "",
    description: formData.get("description") as string || "",
    status: (formData.get("status") as any) || "disponible",
  };

  const validation = vehicleSchema.safeParse(rawFields);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  const validated = validation.data;
  
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
            return { type: "youtube", url: item.url || item.youtubeUrl, embedId: item.embedId || item.youtubeEmbedId };
          }
          if (item.kind === "file") {
            if (item.fileType === "video" || item.type === "video") {
              const url = vidQueue.shift();
              return url ? { type: "video", url } : null;
            } else {
              const url = imgQueue.shift();
              return url ? { type: "image", url } : null;
            }
          }
          if (item.kind === "existing") {
            return { type: item.fileType === "video" || item.isVideo ? "video" : "image", url: item.url };
          }
          return null;
        }).filter(Boolean);

        youtubeVideosField = JSON.stringify(unifiedMedia);

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

  const newVehicle = {
    agency_id: "00000000-0000-0000-0000-000000000000",
    ...validated,
    images: finalImages.length > 0 ? finalImages : ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"],
    videos: finalVideos,
    youtube_videos: youtubeVideosField,
  };

  const { data, error } = await (supabase.from('vehicles') as any).insert([newVehicle]).select().single();
  if (error) {
    console.error("Error creating vehicle:", error);
    return { success: false, error: "Failed to create vehicle" };
  }
  const createdVehicle = data;

  revalidatePath("/admin");
  revalidatePath("/admin/vehicles");
  revalidatePath("/portal/demo", "layout");

  return { success: true, data: createdVehicle || newVehicle };
}

export async function updateVehicle(vehicleId: string, formData: FormData) {
  const { data: existingVehicle, error: fetchError } = await (supabase.from('vehicles') as any).select('*').eq('id', vehicleId).single();
  if (fetchError || !existingVehicle) {
    return { success: false, error: "Vehículo no encontrado" };
  }
  if (!existingVehicle) {
    return { success: false, error: "Vehículo no encontrado" };
  }

  const rawFields = {
    brand: formData.get("brand") as string,
    model: formData.get("model") as string,
    year: Number(formData.get("year")),
    kms: Number(formData.get("kms")),
    transmission: formData.get("transmission") as any,
    fuel: formData.get("fuel") as any,
    price: Number(formData.get("price")),
    currency: (formData.get("currency") as string) || "USD",
    color: formData.get("color") as string || "",
    engine: formData.get("engine") as string || "",
    doors: formData.get("doors") ? Number(formData.get("doors")) : null,
    plate: formData.get("plate") as string || "",
    description: formData.get("description") as string || "",
    status: (formData.get("status") as any) || "disponible",
  };

  const validation = vehicleSchema.safeParse(rawFields);
  if (!validation.success) {
    return { success: false, error: validation.error.flatten().fieldErrors };
  }

  const validated = validation.data;

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
            return { type: "youtube", url: item.url || item.youtubeUrl, embedId: item.embedId || item.youtubeEmbedId };
          }
          if (item.kind === "file") {
            if (item.fileType === "video" || item.type === "video") {
              const url = vidQueue.shift();
              return url ? { type: "video", url } : null;
            } else {
              const url = imgQueue.shift();
              return url ? { type: "image", url } : null;
            }
          }
          if (item.kind === "existing") {
            return { type: item.fileType === "video" || item.isVideo ? "video" : "image", url: item.url };
          }
          return null;
        }).filter(Boolean);

        youtubeVideosField = JSON.stringify(unifiedMedia);

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
      console.error("Error parsing media_layout in update:", e);
    }
  } else {
    youtubeVideosField = formData.get("youtube_videos") as string || null;
  }

  // Fallback to existing media if empty
  if (finalImages.length === 0 && existingVehicle) {
    finalImages = existingVehicle.images || [];
  }
  if (finalVideos.length === 0 && existingVehicle) {
    finalVideos = existingVehicle.videos || [];
  }
  if (!youtubeVideosField && existingVehicle) {
    youtubeVideosField = existingVehicle.youtube_videos || null;
  }

  const updatePayload = {
    ...validated,
    images: finalImages,
    videos: finalVideos,
    youtube_videos: youtubeVideosField,
  };

  const { data: updatedVehicle, error: updateError } = await (supabase.from('vehicles') as any)
    .update(updatePayload)
    .eq('id', vehicleId)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating vehicle:", updateError);
    return { success: false, error: "Failed to update vehicle" };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/vehicles");
  revalidatePath(`/portal/demo/${vehicleId}`);
  revalidatePath("/portal/demo", "layout");

  return { success: true, data: updatedVehicle };
}

export async function deleteVehicle(vehicleId: string) {
  const { error } = await (supabase.from('vehicles') as any).delete().eq('id', vehicleId);
  if (error) {
    return { success: false, error: "Vehículo no encontrado o no se pudo eliminar" };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/vehicles");
  revalidatePath("/portal/demo", "layout");

  return { success: true };
}

export async function getAutoLeads(agencyId: string) {
  const { data, error } = await (supabase.from('auto_leads') as any).select('*').eq('agency_id', agencyId);
  if (error) {
    console.error("Error fetching leads:", error);
    return [];
  }
  return data || [];
}

export async function createAutoLead(lead: {
  name: string;
  email?: string;
  phone?: string;
  vehicle: string;
  vehicleId: string;
  message?: string;
}) {
  const newLead = {
    agency_id: "00000000-0000-0000-0000-000000000000",
    name: lead.name,
    email: lead.email || "",
    phone: lead.phone || "",
    vehicle: lead.vehicle,
    vehicle_id: lead.vehicleId,
    message: lead.message || "Interesado en vehículo.",
    status: "nuevo",
    time: "Ahora",
    assigned_agent_id: "agent-1" // default assign
  };

  const { data, error } = await (supabase.from('auto_leads') as any).insert([newLead]).select().single();
  if (error) {
    console.error("Error creating auto lead:", error);
    return { success: false, error: "Error creating lead" };
  }
  const createdLead = data;

  revalidatePath("/admin");
  revalidatePath("/admin/crm");

  return { success: true, data: createdLead || newLead };
}

export async function updateAutoLeadStatus(leadId: string, status: string) {
  const { data, error } = await (supabase.from('auto_leads') as any)
    .update({ status })
    .eq('id', leadId)
    .select()
    .single();

  if (error) {
    return { success: false, error: "Lead no encontrado" };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/crm");

  return { success: true, data };
}

export async function deleteAutoLead(leadId: string) {
  const { error } = await (supabase.from('auto_leads') as any).delete().eq('id', leadId);
  if (error) {
    return { success: false, error: "Lead no encontrado" };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/crm");

  return { success: true };
}

export async function getAutoStats(agencyId: string) {
  const { data: agencyVehicles } = await (supabase.from('vehicles') as any).select('status').eq('agency_id', agencyId);
  const { data: agencyLeads } = await (supabase.from('auto_leads') as any).select('status').eq('agency_id', agencyId);
  
  const vehiclesList = agencyVehicles || [];
  const leadsList = agencyLeads || [];
  
  const stockCount = vehiclesList.filter((v: any) => v.status === "disponible").length;
  const reservedCount = vehiclesList.filter((v: any) => v.status === "reservado").length;
  const soldCount = vehiclesList.filter((v: any) => v.status === "vendido").length;

  const totalLeads = leadsList.length;
  const newLeads = leadsList.filter((l: any) => l.status === "nuevo").length;
  const contactLeads = leadsList.filter((l: any) => l.status === "contactado").length;
  const testDriveLeads = leadsList.filter((l: any) => l.status === "test_drive").length;
  const negotiationLeads = leadsList.filter((l: any) => l.status === "negociacion").length;
  const closedLeads = leadsList.filter((l: any) => l.status === "cerrado").length;

  return {
    vehicles: {
      total: vehiclesList.length,
      disponible: stockCount,
      reservado: reservedCount,
      vendido: soldCount
    },
    leads: {
      total: totalLeads,
      nuevo: newLeads,
      contactado: contactLeads,
      test_drive: testDriveLeads,
      negociacion: negotiationLeads,
      cerrado: closedLeads
    }
  };
}

// ==========================================
// INTEGRATIONS & CHANNELS ACTIONS
// ==========================================

export async function getIntegrations() {
  const baseIntegrations = {
    mercadolibre: { connected: false, username: "", token: "", refresh_token: "", expires_at: 0, mode: "production" as "production" | "simulation" },
    facebook: { connected: false, pageName: "", token: "", refresh_token: "" },
    instagram: { connected: false, handle: "", token: "", refresh_token: "" },
    whatsapp: { connected: false, phoneNumber: "" }
  };

  try {
    const { data, error } = await (supabase.from("auto_integrations") as any)
      .select("*")
      .eq("agency_id", "00000000-0000-0000-0000-000000000000");
      
    if (!error && data && data.length > 0) {
      const result = { ...baseIntegrations };
      data.forEach((row: any) => {
        const ch = row.channel as keyof typeof baseIntegrations;
        if (result[ch]) {
          (result[ch] as any).connected = row.connected;
          (result[ch] as any).username = row.username;
          (result[ch] as any).token = row.token;
          if (ch === 'mercadolibre') {
            (result.mercadolibre as any).refresh_token = row.refresh_token;
            (result.mercadolibre as any).expires_at = row.expires_at ? Number(row.expires_at) : 0;
            (result.mercadolibre as any).mode = row.mode;
          } else if (ch === 'facebook') {
            (result.facebook as any).pageName = row.username;
            (result.facebook as any).refresh_token = row.refresh_token;
          } else if (ch === 'instagram') {
            (result.instagram as any).handle = row.username;
            (result.instagram as any).refresh_token = row.refresh_token;
          } else if (ch === 'whatsapp') {
            (result.whatsapp as any).phoneNumber = row.username;
          }
        }
      });
      return result;
    }
  } catch (e) {
    console.error("Error reading integrations from Supabase", e);
  }

  return baseIntegrations;
}

export async function updateIntegration(
  channel: 'mercadolibre' | 'facebook' | 'instagram' | 'whatsapp',
  connected: boolean,
  data?: any
) {
  let username = "";
  let token = "";
  let refreshToken = "";
  let expiresAt = 0;
  let mode = "production";

  if (channel === 'mercadolibre') {
    username = connected ? (data?.username || "") : "";
    token = connected ? (data?.token || "") : "";
    mode = data?.mode || "production";
  } else if (channel === 'facebook') {
    username = connected ? (data?.pageName || "") : "";
    token = connected ? (data?.token || "") : "";
  } else if (channel === 'instagram') {
    username = connected ? (data?.handle || "") : "";
  } else if (channel === 'whatsapp') {
    username = connected ? (data?.phoneNumber || "") : "";
  }

  try {
    await (supabase.from("auto_integrations") as any).upsert({
      channel,
      agency_id: "00000000-0000-0000-0000-000000000000",
      connected,
      username,
      token,
      refresh_token: channel === 'mercadolibre' ? refreshToken : null,
      expires_at: channel === 'mercadolibre' && expiresAt > 0 ? expiresAt : null,
      mode: channel === 'mercadolibre' ? mode : null,
      updated_at: new Date().toISOString()
    }, { onConflict: "channel" });
  } catch (e) {
    console.error("Error updating integration in Supabase", e);
  }

  revalidatePath("/admin/integrations");
  revalidatePath("/admin/inbox");

  const updatedIntegrations = await getIntegrations();
  return { success: true, integrations: updatedIntegrations };
}

export async function getVehiclePublications() {
  const { data, error } = await (supabase.from("auto_vehicle_publications") as any).select("*");
  if (error) {
    console.error("Error reading vehicle publications from Supabase", error);
    return [];
  }
  return data || [];
}

// Helper to refresh MercadoLibre Access Token
export async function refreshMLToken(force: boolean = false) {
  const integrations = await getIntegrations();
  const ml = integrations.mercadolibre;

  if (!ml || !ml.connected) return null;

  const appId = process.env.MERCADOLIBRE_APP_ID;
  const secretKey = process.env.MERCADOLIBRE_SECRET_KEY;

  if (!appId || !secretKey || !ml.refresh_token || ml.mode !== "production") {
    return ml.token || null;
  }


  const expiresAt = ml.expires_at || 0;
  
  // Si NO estamos forzando y el token aún tiene más de 5 minutos de vida, lo usamos
  if (!force && Date.now() < expiresAt - 5 * 60 * 1000) {
    return ml.token || null;
  }


  try {
    console.log("Renovando Access Token de MercadoLibre en Supabase...");
    const response = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: appId,
        client_secret: secretKey,
        refresh_token: ml.refresh_token
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Error al refrescar token");

    await (supabase.from("auto_integrations") as any).update({
      token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in * 1000),
      updated_at: new Date().toISOString()
    }).eq("channel", "mercadolibre");

    return data.access_token;
  } catch (err) {
    console.error("Fallo al refrescar token de MercadoLibre:", err);
    return null;
  }
}

export async function publishVehicle(
  vehicleId: string,
  channel: 'mercadolibre' | 'facebook' | 'instagram'
) {
  // 1. Verificar si ya existe en Supabase
  const { data: existingPubs } = await (supabase
    .from("auto_vehicle_publications") as any)
    .select("*")
    .eq("vehicle_id", vehicleId)
    .eq("channel", channel);

  if (existingPubs && existingPubs.length > 0) {
    await (supabase
      .from("auto_vehicle_publications") as any)
      .update({ status: 'published' })
      .eq("id", existingPubs[0].id);
    
    revalidatePath("/admin/integrations");
    return { success: true, data: { ...existingPubs[0], status: 'published' } };
  }
  
  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle) {
    return { success: false, error: "Vehículo no encontrado en inventario" };
  }

  const integrations = await getIntegrations();
  const ml = integrations.mercadolibre;

  // Si el canal es MercadoLibre
  if (channel === 'mercadolibre' && ml?.connected && ml.mode === 'production') {
    const token = await refreshMLToken();
    if (!token) {
      return { success: false, error: "No se pudo obtener el token de MercadoLibre o está expirado" };
    }

    try {
      const descriptionText = vehicle.description || "Concesionario Oficial Automotora";

      const payload = {
        title: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
        category_id: "MLU1744",
        price: vehicle.price,
        currency_id: vehicle.currency || "USD",
        available_quantity: 1,
        buying_mode: "classified",
        listing_type_id: "silver",
        condition: "used",
        pictures: vehicle.images.map((imgUrl: string) => {
          let absoluteUrl = imgUrl;
          if (!imgUrl.startsWith("http")) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            const cleanAppUrl = appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl;
            const cleanImgUrl = imgUrl.startsWith("/") ? imgUrl : `/${imgUrl}`;
            absoluteUrl = `${cleanAppUrl}${cleanImgUrl}`;
          }
          return { source: absoluteUrl };
        }),
        attributes: [
          { id: "BRAND", value_name: vehicle.brand },
          { id: "MODEL", value_name: vehicle.model },
          { id: "VEHICLE_YEAR", value_name: vehicle.year.toString() },
          { id: "KILOMETERS", value_name: vehicle.kms.toString() },
          ...(vehicle.doors ? [{ id: "DOORS", value_name: vehicle.doors.toString() }] : []),
          ...(vehicle.fuel ? [{ id: "FUEL_TYPE", value_name: vehicle.fuel.charAt(0).toUpperCase() + vehicle.fuel.slice(1) }] : []),
          ...(vehicle.transmission ? [{ id: "TRANSMISSION", value_name: vehicle.transmission.charAt(0).toUpperCase() + vehicle.transmission.slice(1) }] : []),
          ...(vehicle.color ? [{ id: "COLOR", value_name: vehicle.color }] : []),
          ...(vehicle.engine ? [{ id: "ENGINE", value_name: vehicle.engine }] : [])
        ]
      };

      console.log("Enviando publicación real a MercadoLibre...", payload);
      const response = await fetch("https://api.mercadolibre.com/items", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Fallo en API de MercadoLibre al crear publicación");
      }

      try {
        console.log(`Guardando descripción para el item ${data.id}...`);
        const descResponse = await fetch(`https://api.mercadolibre.com/items/${data.id}/description`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            plain_text: descriptionText
          })
        });
        if (!descResponse.ok) {
          const descError = await descResponse.json();
          console.error("Fallo al guardar la descripción en MercadoLibre:", descError);
        }
      } catch (descErr) {
        console.error("Error al enviar descripción:", descErr);
      }

      const newPub = {
        id: `pub-${data.id}`,
        vehicle_id: vehicleId,
        channel,
        status: 'published',
        external_url: data.permalink,
        views: 0,
        questions_count: 0,
        published_at: new Date().toISOString()
      };

      await (supabase.from("auto_vehicle_publications") as any).insert([newPub]);
      
      revalidatePath("/admin/integrations");
      return { success: true, data: newPub };
    } catch (err: any) {
      console.error("Error al publicar en ML producción:", err);
      return { success: false, error: err.message || "Fallo al comunicar con la API de MercadoLibre" };
    }
  }

  // Si el canal es Facebook
  if (channel === 'facebook' && integrations.facebook?.connected) {
    const token = integrations.facebook.token;
    const pageId = integrations.facebook.refresh_token; 
    
    if (!token || !pageId) return { success: false, error: "Token de Facebook no disponible o sesión expirada." };

    try {
      const message = `🚘 Nuevo Ingreso: ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n💰 Precio: ${vehicle.currency || 'USD'} ${vehicle.price.toLocaleString()}\n📏 Kms: ${vehicle.kms.toLocaleString()}\n\n${vehicle.description || ""}`;
      const pictureUrl = (vehicle.images && vehicle.images.length > 0) ? vehicle.images[0] : null;

      let absoluteUrl = pictureUrl;
      if (absoluteUrl && !absoluteUrl.startsWith("http")) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        absoluteUrl = `${appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl}${absoluteUrl.startsWith("/") ? absoluteUrl : `/${absoluteUrl}`}`;
      }

      const postPayload: any = {
        message,
        access_token: token
      };
      
      let endpoint = `https://graph.facebook.com/v19.0/${pageId}/feed`;
      
      if (absoluteUrl) {
        endpoint = `https://graph.facebook.com/v19.0/${pageId}/photos`;
        postPayload.url = absoluteUrl;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postPayload)
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error.message);

      const postId = data.post_id || data.id;
      const newPub = {
        id: `pub-fb-${postId}`,
        vehicle_id: vehicleId,
        channel: 'facebook',
        status: 'published',
        external_url: `https://facebook.com/${postId}`,
        views: 0,
        questions_count: 0,
        published_at: new Date().toISOString()
      };

      await (supabase.from("auto_vehicle_publications") as any).insert([newPub]);
      revalidatePath("/admin/integrations");
      return { success: true, data: newPub };
    } catch (err: any) {
      console.error("Error al publicar en Facebook:", err);
      return { success: false, error: "Fallo al comunicar con la API de Facebook: " + err.message };
    }
  }

  // Si el canal es Instagram
  if (channel === 'instagram' && integrations.instagram?.connected) {
    const token = integrations.instagram.token; // Page Access Token
    const igId = integrations.instagram.refresh_token; 
    
    if (!token || !igId) return { success: false, error: "Token de Instagram no disponible." };

    try {
      const caption = `🚘 ${vehicle.brand} ${vehicle.model} ${vehicle.year}\n💰 ${vehicle.currency || 'USD'} ${vehicle.price.toLocaleString()}\n📏 Kms: ${vehicle.kms.toLocaleString()}\n\n${vehicle.description || ""}`;
      const pictureUrl = (vehicle.images && vehicle.images.length > 0) ? vehicle.images[0] : null;

      if (!pictureUrl) {
        return { success: false, error: "Instagram requiere al menos una imagen para publicar." };
      }

      let absoluteUrl = pictureUrl;
      if (!absoluteUrl.startsWith("http")) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        absoluteUrl = `${appUrl.endsWith("/") ? appUrl.slice(0, -1) : appUrl}${absoluteUrl.startsWith("/") ? absoluteUrl : `/${absoluteUrl}`}`;
      }

      // Paso 1: Crear el contenedor de medios
      const createContainerRes = await fetch(`https://graph.facebook.com/v19.0/${igId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: absoluteUrl,
          caption: caption,
          access_token: token
        })
      });
      const containerData = await createContainerRes.json();
      if (containerData.error) throw new Error("Crear contenedor: " + containerData.error.message);

      const creationId = containerData.id;

      // Paso 2: Publicar el contenedor
      const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igId}/media_publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: token
        })
      });
      const publishData = await publishRes.json();
      if (publishData.error) throw new Error("Publicar contenedor: " + publishData.error.message);

      const newPub = {
        id: `pub-ig-${publishData.id}`,
        vehicle_id: vehicleId,
        channel: 'instagram',
        status: 'published',
        external_url: `https://instagram.com/p/${publishData.id}`, // En un entorno real se buscaría el permalink con un GET adicional
        views: 0,
        questions_count: 0,
        published_at: new Date().toISOString()
      };

      await (supabase.from("auto_vehicle_publications") as any).insert([newPub]);
      revalidatePath("/admin/integrations");
      return { success: true, data: newPub };
    } catch (err: any) {
      console.error("Error al publicar en Instagram:", err);
      return { success: false, error: "Fallo al comunicar con la API de Instagram: " + err.message };
    }
  }

  return { success: false, error: "Conexión a " + channel + " no configurada correctamente." };
}

export async function unpublishVehicle(vehicleId: string, channel: 'mercadolibre' | 'facebook' | 'instagram') {
  await (supabase
    .from("auto_vehicle_publications") as any)
    .delete()
    .eq("vehicle_id", vehicleId)
    .eq("channel", channel);

  revalidatePath("/admin/integrations");
  return { success: true };
}

export async function fetchMercadoLibreListings() {
  const integrations = await getIntegrations();
  const ml = integrations.mercadolibre;

  if (!ml || !ml.connected) {
    return { success: false, error: "MercadoLibre no está conectado." };
  }

  if (ml.mode === 'production') {
    let token = await refreshMLToken();
    if (!token) return { success: false, error: "No se pudo renovar token de MercadoLibre" };

    try {
      let userRes = await fetch("https://api.mercadolibre.com/users/me", {
        headers: { "Authorization": `Bearer ${token}` },
        cache: 'no-store'
      });
      
      if (userRes.status === 401) {
          console.log("Token de ML rechazado. Forzando renovación automática...");
          token = await refreshMLToken(true);
          if (!token) throw new Error("Token expirado y no se pudo renovar");
          
          userRes = await fetch("https://api.mercadolibre.com/users/me", {
            headers: { "Authorization": `Bearer ${token}` },
            cache: 'no-store'
          });
      }

      const userData = await userRes.json();
      if (!userRes.ok) throw new Error(userData.message || "Error obteniendo perfil");
      const userId = userData.id;

      // Buscar items activos y pausados
      const searchActiveRes = await fetch(`https://api.mercadolibre.com/users/${userId}/items/search?status=active`, {
        headers: { "Authorization": `Bearer ${token}` },
        cache: 'no-store'
      });
      const searchPausedRes = await fetch(`https://api.mercadolibre.com/users/${userId}/items/search?status=paused`, {
        headers: { "Authorization": `Bearer ${token}` },
        cache: 'no-store'
      });

      let itemIds: string[] = [];
      if (searchActiveRes.ok) {
         const data = await searchActiveRes.json();
         itemIds.push(...(data.results || []));
      }
      if (searchPausedRes.ok) {
         const data = await searchPausedRes.json();
         itemIds.push(...(data.results || []));
      }

      if (itemIds.length === 0) {
        const publicSearchRes = await fetch(`https://api.mercadolibre.com/sites/MLU/search?seller_id=${userId}`, {
          headers: { "Authorization": `Bearer ${token}` },
          cache: 'no-store'
        });
        const publicSearchData = await publicSearchRes.json();
        if (publicSearchRes.ok && publicSearchData.results) {
           itemIds = publicSearchData.results.map((r: any) => r.id);
        }
      }

      // Eliminar duplicados si los hubiera
      itemIds = Array.from(new Set(itemIds));

      const listings = [];
      for (const itemId of itemIds) {
        const itemRes = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
          headers: { "Authorization": `Bearer ${token}` },
          cache: 'no-store'
        });
        if (itemRes.ok) {
          const itemData = await itemRes.json();
          listings.push({
             id: itemData.id,
             title: itemData.title,
             price: itemData.price,
             currency: itemData.currency_id,
             status: itemData.status,
             thumbnail: itemData.pictures?.[0]?.secure_url || itemData.secure_thumbnail || itemData.thumbnail,
             permalink: itemData.permalink,
             raw_data: itemData 
          });
        }
      }

      return { success: true, listings };
    } catch (err: any) {
      console.error("Fallo al buscar publicaciones de MercadoLibre:", err);
      return { success: false, error: err.message || "Fallo en la comunicación con la API de MercadoLibre" };
    }
  }
  return { success: false, error: "Conexión a MercadoLibre no configurada en modo producción." };
}

export async function importSelectedMLListings(selectedItems: any[]) {
  const integrations = await getIntegrations();
  const ml = integrations.mercadolibre;

  if (!ml || !ml.connected || ml.mode !== 'production') {
    return { success: false, error: "MercadoLibre no está conectado." };
  }

  let token = await refreshMLToken();
  if (!token) return { success: false, error: "No se pudo renovar token de MercadoLibre" };

  try {
    const vehicles = await getVehicles("00000000-0000-0000-0000-000000000000");
    const syncedPubs = [];

    for (const item of selectedItems) {
      const itemData = item.raw_data;
      const itemId = itemData.id;
      const price = itemData.price;
      const titleLower = itemData.title?.toLowerCase() || "";
      
      let matchingVehicle = vehicles.find((v: any) => v.price === price);
      
      if (!matchingVehicle) {
         matchingVehicle = vehicles.find((v: any) => 
           titleLower.includes(v.brand?.toLowerCase() || "xxx") || 
           titleLower.includes(v.model?.toLowerCase() || "xxx")
         );
      }

      if (!matchingVehicle) {
        const getAttr = (id: string, def: string) => {
          const attr = itemData.attributes?.find((a: any) => a.id === id);
          return attr ? attr.value_name : def;
        };

        matchingVehicle = {
          agency_id: "00000000-0000-0000-0000-000000000000",
          brand: getAttr("BRAND", "Auto"),
          model: getAttr("MODEL", itemData.title).substring(0, 99),
          year: parseInt(getAttr("VEHICLE_YEAR", "2020")) || 2020,
          kms: parseInt(getAttr("KILOMETERS", "0").replace(/\D/g, '') || "0") || 0,
          transmission: getAttr("TRANSMISSION", "Manual").toLowerCase(),
          fuel: getAttr("FUEL_TYPE", "Nafta").toLowerCase(),
          price: price,
          currency: itemData.currency_id || "USD",
          color: getAttr("COLOR", "Blanco").substring(0, 99),
          engine: getAttr("ENGINE", "1.0").substring(0, 99),
          doors: parseInt(getAttr("DOORS", "4")) || 4,
          plate: "",
          description: "Importado automáticamente desde MercadoLibre.",
          images: [
            itemData.pictures?.[0]?.secure_url || itemData.secure_thumbnail || itemData.thumbnail || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
          ],
          status: "disponible",
        };
        
        delete (matchingVehicle as any).id;
        const { data, error } = await (supabase.from('vehicles') as any).insert([matchingVehicle]).select().single();
        if (error) {
          console.error("Error al insertar vehículo:", error, matchingVehicle);
          throw new Error(`Error de Supabase: ${error.message} | Payload: ${JSON.stringify(matchingVehicle).substring(0, 150)}...`);
        }
        if (data) {
          matchingVehicle = data;
        }
      }

      let realVisits = Math.floor(Math.random() * 80) + 10;
      try {
        const vRes = await fetch(`https://api.mercadolibre.com/visits/items?ids=${itemId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const vData = await vRes.json();
        if (vData && vData[itemId]) {
          realVisits = vData[itemId];
        }
      } catch(e) {}

      let realQuestions = 0;
      try {
        const qRes = await fetch(`https://api.mercadolibre.com/questions/search?item=${itemId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const qData = await qRes.json();
        if (qData && typeof qData.total === 'number') {
          realQuestions = qData.total;
        }
      } catch(e) {}

      syncedPubs.push({
        id: crypto.randomUUID(),
        agency_id: "00000000-0000-0000-0000-000000000000",
        vehicle_id: matchingVehicle.id,
        channel: 'mercadolibre',
        status: itemData.status === 'paused' ? 'pending' : 'published',
        external_id: itemData.id,
        external_url: itemData.permalink,
        views: realVisits,
        questions_count: realQuestions,
        published_at: itemData.start_time || new Date().toISOString()
      });
    }

    for (const pub of syncedPubs) {
      const { error: pubError } = await (supabase.from("auto_vehicle_publications") as any).upsert(pub, { onConflict: "vehicle_id, channel" });
      if (pubError) {
         console.error("Error upserting publication:", pubError, pub);
         throw new Error(`Error al guardar publicación: ${pubError.message} | Payload: ${JSON.stringify(pub).substring(0, 150)}...`);
      }
    }

    revalidatePath("/admin/integrations");
    return { success: true, count: syncedPubs.length };
  } catch (err: any) {
    console.error("Fallo al importar publicaciones de MercadoLibre:", err);
    return { success: false, error: err.message || "Error al importar" };
  }
}

// ==========================================
// INBOX & MESSAGING ACTIONS
// ==========================================

export async function getInboxConversations() {
  const { data: dbConvs } = await (supabase.from('inbox_conversations') as any).select('*');
  let conversations = dbConvs || [];

  try {
    const integrations = await getIntegrations();
    const ml = integrations.mercadolibre;

    if (ml && ml.connected && ml.mode === "production") {
      const token = await refreshMLToken();
      if (token) {
        // 1. Obtener el ID del vendedor
        const meRes = await fetch("https://api.mercadolibre.com/users/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData && meData.id) {
            const sellerId = meData.id;

            // 2. Traer las preguntas asociadas al vendedor
            const qRes = await fetch(`https://api.mercadolibre.com/questions/search?seller_id=${sellerId}&limit=20`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            
            if (qRes.ok) {
              const qData = await qRes.json();
              const mlQuestions = qData.questions || [];

              // 3. Obtener las publicaciones para asociar item_id -> vehicle_id
              const pubs = await getVehiclePublications();
              const mlPubs = pubs.filter((p: any) => p.channel === "mercadolibre");

              const itemToVehicleMap: Record<string, string> = {};
              for (const pub of mlPubs) {
                const itemId = pub.id.replace("pub-", "");
                itemToVehicleMap[itemId] = pub.vehicle_id;
              }

              // Filtrar conversaciones mock del canal MercadoLibre para usar solo las reales
              conversations = conversations.filter((c: any) => c.channel !== "mercadolibre");

              // 4. Mapear cada pregunta
              for (const q of mlQuestions) {
                const vehicleId = itemToVehicleMap[q.item_id] || "veh-1";
                
                const messages: {
                  id: string;
                  sender: 'lead' | 'agent';
                  text: string;
                  time: string;
                  status?: 'sent' | 'delivered' | 'read';
                }[] = [
                  {
                    id: `ml-msg-q-${q.id}`,
                    sender: 'lead' as const,
                    text: q.text,
                    time: new Date(q.date_created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: 'read' as const
                  }
                ];

                if (q.answer) {
                  messages.push({
                    id: `ml-msg-a-${q.id}`,
                    sender: 'agent' as const,
                    text: q.answer.text,
                    time: new Date(q.answer.date_created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: 'read' as const
                  });
                }

                const lastMessage = q.answer ? q.answer.text : q.text;
                const lastTime = q.answer ? q.answer.date_created : q.date_created;

                conversations.push({
                  id: `ml-question-${q.id}`,
                  lead_id: `ml-buyer-${q.from?.id || 'anon'}`,
                  lead_name: q.from?.nickname || `Usuario ML (${q.from?.id || '?'})`,
                  lead_avatar: "ML",
                  channel: 'mercadolibre' as const,
                  last_message: lastMessage,
                  last_message_time: new Date(lastTime).toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + " " + new Date(lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  unread: q.status === "UNANSWERED",
                  vehicle_id: vehicleId,
                  messages,
                  notes: ""
                });
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Error al sincronizar conversaciones reales con MercadoLibre:", err);
  }

  return conversations;
}

export async function sendInboxMessage(conversationId: string, text: string) {
  if (conversationId.startsWith("ml-question-")) {
    const questionId = conversationId.replace("ml-question-", "");
    const integrations = await getIntegrations();
    const ml = integrations.mercadolibre;

    if (!ml || !ml.connected || ml.mode !== "production") {
      return { success: false, error: "MercadoLibre no está conectado en modo real" };
    }

    const token = await refreshMLToken();
    if (!token) {
      return { success: false, error: "No se pudo renovar token de MercadoLibre" };
    }

    try {
      console.log(`Respondiendo pregunta real en MercadoLibre ID: ${questionId}...`);
      const response = await fetch("https://api.mercadolibre.com/answers", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          question_id: Number(questionId),
          text: text
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Fallo en API de MercadoLibre al enviar respuesta");
      }

      revalidatePath("/admin/inbox");

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        success: true,
        conversation: {
          id: conversationId,
          last_message: text,
          last_message_time: timeStr,
          unread: false,
          messages: [
            {
              id: `ml-msg-q-${questionId}`,
              sender: 'lead' as const,
              text: "Pregunta original",
              time: timeStr
            },
            {
              id: `ml-msg-a-${questionId}`,
              sender: 'agent' as const,
              text: text,
              time: timeStr,
              status: 'read' as const
            }
          ]
        }
      };
    } catch (err: any) {
      console.error("Error al responder pregunta de MercadoLibre:", err);
      return { success: false, error: err.message || "Fallo al enviar respuesta a MercadoLibre" };
    }
  }

  const { data: conversation, error: fetchErr } = await (supabase.from('inbox_conversations') as any).select('*').eq('id', conversationId).single();
  if (fetchErr || !conversation) {
    return { success: false, error: "Conversación no encontrada" };
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newMsg = {
    id: `msg-${Date.now()}`,
    sender: 'agent' as const,
    text,
    time: timeStr,
    status: 'sent' as const
  };

  const newMessages = [...(conversation.messages || []), newMsg];
  const { data: updatedConv, error: updateErr } = await (supabase.from('inbox_conversations') as any)
    .update({ messages: newMessages, last_message: text, last_message_time: timeStr, unread: false })
    .eq('id', conversationId)
    .select()
    .single();
  if (updateErr) {
    console.error("Error updating conversation:", updateErr);
  } else {
    conversation.messages = updatedConv.messages;
    conversation.last_message = updatedConv.last_message;
    conversation.last_message_time = updatedConv.last_message_time;
    conversation.unread = updatedConv.unread;
  }
  revalidatePath("/admin/inbox");
  return { success: true, conversation };
}

export async function simulateLeadReply(conversationId: string, agentMessageText: string) {
  const { data: conversation, error: fetchErr } = await (supabase.from('inbox_conversations') as any).select('*').eq('id', conversationId).single();
  if (fetchErr || !conversation) {
    return { success: false, error: "Conversación no encontrada" };
  }

  // Generar respuesta inteligente basada en el texto del agente
  const textNormalized = agentMessageText.toLowerCase();
  let replyText = "¡Gracias por responder! Me estaré comunicando pronto.";

  if (textNormalized.includes("visita") || textNormalized.includes("test drive") || textNormalized.includes("coordinar") || textNormalized.includes("probar")) {
    replyText = "Me vendría súper bien coordinar para mañana en la tarde, tipo 15:30 o 16:00 hs. ¿Te queda bien esa hora?";
  } else if (textNormalized.includes("precio") || textNormalized.includes("valor") || textNormalized.includes("costo") || textNormalized.includes("financiar") || textNormalized.includes("financiación") || textNormalized.includes("cuotas")) {
    replyText = "Perfecto, ¿cuáles son los requisitos para la financiación? ¿Toman permuta y financian el saldo?";
  } else if (textNormalized.includes("permuta") || textNormalized.includes("auto") || textNormalized.includes("vehículo") || textNormalized.includes("tomar")) {
    replyText = "Tengo una camioneta usada en excelente estado para entregar como parte de pago. ¿Puedo llevarla para que la tasen?";
  } else if (textNormalized.includes("hola") || textNormalized.includes("buenos días") || textNormalized.includes("buenas tardes")) {
    replyText = "Hola, sí. Estaba interesado en el vehículo que tienen publicado, me gustaría saber si sigue disponible y si hacen envíos al interior.";
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newMsg = {
    id: `msg-${Date.now()}-lead`,
    sender: 'lead' as const,
    text: replyText,
    time: timeStr,
    status: 'read' as const
  };

  const newMessages = [...(conversation.messages || []), newMsg];
  const { data: updatedConv, error: updateErr } = await (supabase.from('inbox_conversations') as any)
    .update({ messages: newMessages, last_message: replyText, last_message_time: timeStr, unread: true })
    .eq('id', conversationId)
    .select()
    .single();
  if (!updateErr && updatedConv) {
    conversation.messages = updatedConv.messages;
    conversation.last_message = updatedConv.last_message;
    conversation.last_message_time = updatedConv.last_message_time;
    conversation.unread = updatedConv.unread;
  }
  revalidatePath("/admin/inbox");
  return { success: true, conversation };
}

export async function markConversationRead(conversationId: string) {
  await (supabase.from('inbox_conversations') as any).update({ unread: false }).eq('id', conversationId);
  revalidatePath("/admin/inbox");
  return { success: true };
}

export async function updateConversationNotes(conversationId: string, notes: string) {
  await (supabase.from('inbox_conversations') as any).update({ notes }).eq('id', conversationId);
  revalidatePath("/admin/inbox");
  return { success: true };
}

export async function importSocialPost(channel: 'facebook' | 'instagram', postData: any) {
  

  // Crear vehículo basado en el post
  const newVehicle = {
    id: `veh-${channel}-${postData.id}`,
    agency_id: "00000000-0000-0000-0000-000000000000",
    brand: postData.brand || "Desconocido",
    model: postData.model || "Vehículo Importado",
    year: postData.year || 2020,
    kms: postData.kms || 0,
    transmission: "manual",
    fuel: "nafta",
    price: postData.price || 0,
    currency: "USD",
    color: "Sin especificar",
    engine: "1.0",
    doors: 4,
    plate: "",
    description: postData.description || `Importado desde ${channel === 'facebook' ? 'Facebook' : 'Instagram'}.`,
    images: postData.images && postData.images.length > 0 ? postData.images : ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"],
    status: "disponible",
    };

  delete (newVehicle as any).id;
  const { data: createdVehicle, error: vError } = await (supabase.from('vehicles') as any).insert([newVehicle]).select().single();
  if (vError || !createdVehicle) {
    console.error("Error creating vehicle:", vError);
    return { success: false, error: "Failed to create vehicle" };
  }
  newVehicle.id = createdVehicle.id;

  // Crear la publicación en base de datos
  const newPub = {
    id: crypto.randomUUID(),
    agency_id: "00000000-0000-0000-0000-000000000000",
    vehicle_id: newVehicle.id,
    channel: channel,
    status: 'published',
    external_id: postData.id,
    external_url: postData.external_url || "#",
    views: Math.floor(Math.random() * 150) + 10,
    questions_count: Math.floor(Math.random() * 5),
    published_at: postData.date || new Date().toISOString()
  };

  const { error: pubError } = await (supabase.from("auto_vehicle_publications") as any).upsert(newPub, { onConflict: "vehicle_id, channel" });
  if (pubError) {
    console.error("Error upserting social publication:", pubError, newPub);
    throw new Error(`Error al guardar publicación: ${pubError.message}`);
  }

  revalidatePath("/admin/integrations");
  revalidatePath("/admin/vehicles");
  
  return { success: true, vehicle: newVehicle, publication: newPub };
}
