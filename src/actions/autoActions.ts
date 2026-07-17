"use server";

import { getDb, saveDb } from "@/lib/localDb";
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
  const db = getDb();
  if (!db.vehicles) db.vehicles = [];
  return db.vehicles.filter((v: any) => v.agency_id === agencyId);
}

export async function getVehicleById(vehicleId: string) {
  const db = getDb();
  if (!db.vehicles) db.vehicles = [];
  return db.vehicles.find((v: any) => v.id === vehicleId) || null;
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

  const db = getDb();
  if (!db.vehicles) db.vehicles = [];

  const newVehicle = {
    id: `veh-${Date.now()}`,
    agency_id: "demo-agency-id",
    ...validated,
    images: finalImages.length > 0 ? finalImages : ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"],
    videos: finalVideos,
    youtube_videos: youtubeVideosField,
    created_at: new Date().toISOString(),
  };

  db.vehicles.unshift(newVehicle);
  saveDb(db);

  revalidatePath("/admin");
  revalidatePath("/admin/vehicles");
  revalidatePath("/portal/demo", "layout");

  return { success: true, data: newVehicle };
}

export async function updateVehicle(vehicleId: string, formData: FormData) {
  const db = getDb();
  if (!db.vehicles) db.vehicles = [];
  
  const existingVehicle = db.vehicles.find((v: any) => v.id === vehicleId);
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

  const index = db.vehicles.findIndex((v: any) => v.id === vehicleId);
  db.vehicles[index] = {
    ...existingVehicle,
    ...validated,
    images: finalImages,
    videos: finalVideos,
    youtube_videos: youtubeVideosField,
  };

  saveDb(db);

  revalidatePath("/admin");
  revalidatePath("/admin/vehicles");
  revalidatePath(`/portal/demo/${vehicleId}`);
  revalidatePath("/portal/demo", "layout");

  return { success: true, data: db.vehicles[index] };
}

export async function deleteVehicle(vehicleId: string) {
  const db = getDb();
  if (!db.vehicles) db.vehicles = [];

  const index = db.vehicles.findIndex((v: any) => v.id === vehicleId);
  if (index === -1) {
    return { success: false, error: "Vehículo no encontrado" };
  }

  db.vehicles.splice(index, 1);
  saveDb(db);

  revalidatePath("/admin");
  revalidatePath("/admin/vehicles");
  revalidatePath("/portal/demo", "layout");

  return { success: true };
}

export async function getAutoLeads(agencyId: string) {
  const db = getDb();
  if (!db.auto_leads) db.auto_leads = [];
  return db.auto_leads.filter((l: any) => l.agency_id === agencyId);
}

export async function createAutoLead(lead: {
  name: string;
  email?: string;
  phone?: string;
  vehicle: string;
  vehicleId: string;
  message?: string;
}) {
  const db = getDb();
  if (!db.auto_leads) db.auto_leads = [];

  const newLead = {
    id: `alead-${Date.now()}`,
    agency_id: "demo-agency-id",
    name: lead.name,
    email: lead.email || "",
    phone: lead.phone || "",
    vehicle: lead.vehicle,
    vehicle_id: lead.vehicleId,
    message: lead.message || "Interesado en vehículo.",
    status: "nuevo",
    time: "Ahora",
    created_at: new Date().toISOString(),
    assigned_agent_id: "agent-1" // default assign
  };

  db.auto_leads.push(newLead);
  saveDb(db);

  revalidatePath("/admin");
  revalidatePath("/admin/crm");

  return { success: true, data: newLead };
}

export async function updateAutoLeadStatus(leadId: string, status: string) {
  const db = getDb();
  if (!db.auto_leads) db.auto_leads = [];

  const index = db.auto_leads.findIndex((l: any) => l.id === leadId);
  if (index === -1) {
    return { success: false, error: "Lead no encontrado" };
  }

  db.auto_leads[index].status = status;
  saveDb(db);

  revalidatePath("/admin");
  revalidatePath("/admin/crm");

  return { success: true, data: db.auto_leads[index] };
}

export async function deleteAutoLead(leadId: string) {
  const db = getDb();
  if (!db.auto_leads) db.auto_leads = [];

  const index = db.auto_leads.findIndex((l: any) => l.id === leadId);
  if (index === -1) {
    return { success: false, error: "Lead no encontrado" };
  }

  db.auto_leads.splice(index, 1);
  saveDb(db);

  revalidatePath("/admin");
  revalidatePath("/admin/crm");

  return { success: true };
}

export async function getAutoStats(agencyId: string) {
  const db = getDb();
  if (!db.vehicles) db.vehicles = [];
  if (!db.auto_leads) db.auto_leads = [];
  if (!db.events) db.events = [];

  const agencyVehicles = db.vehicles.filter((v: any) => v.agency_id === agencyId);
  const agencyLeads = db.auto_leads.filter((l: any) => l.agency_id === agencyId);

  const stockCount = agencyVehicles.filter((v: any) => v.status === "disponible").length;
  const reservedCount = agencyVehicles.filter((v: any) => v.status === "reservado").length;
  const soldCount = agencyVehicles.filter((v: any) => v.status === "vendido").length;

  const totalLeads = agencyLeads.length;
  const newLeads = agencyLeads.filter((l: any) => l.status === "nuevo").length;
  const contactLeads = agencyLeads.filter((l: any) => l.status === "contactado").length;
  const testDriveLeads = agencyLeads.filter((l: any) => l.status === "test_drive").length;
  const negotiationLeads = agencyLeads.filter((l: any) => l.status === "negociacion").length;
  const closedLeads = agencyLeads.filter((l: any) => l.status === "cerrado").length;

  return {
    vehicles: {
      total: agencyVehicles.length,
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
    mercadolibre: { connected: false, username: "", token: "", refresh_token: "", expires_at: 0, mode: "production" },
    facebook: { connected: false, pageName: "", token: "" },
    instagram: { connected: false, handle: "" },
    whatsapp: { connected: false, phoneNumber: "" }
  };

  try {
    const { data, error } = await (supabase.from("auto_integrations") as any)
      .select("*")
      .eq("agency_id", "demo-agency-id");
      
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
          } else if (ch === 'instagram') {
            (result.instagram as any).handle = row.username;
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
      agency_id: "demo-agency-id",
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
  const { data, error } = await supabase.from("auto_vehicle_publications").select("*");
  if (error) {
    console.error("Error reading vehicle publications from Supabase", error);
    return [];
  }
  return data || [];
}

// Helper to refresh MercadoLibre Access Token
export async function refreshMLToken() {
  const integrations = await getIntegrations();
  const ml = integrations.mercadolibre;

  if (!ml || !ml.connected) return null;

  const appId = process.env.MERCADOLIBRE_APP_ID;
  const secretKey = process.env.MERCADOLIBRE_SECRET_KEY;

  if (!appId || !secretKey || !ml.refresh_token || ml.mode !== "production") {
    return ml.token || null;
  }

  const expiresAt = ml.expires_at || 0;
  if (Date.now() < expiresAt - 5 * 60 * 1000) {
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
  const { data: existingPubs } = await supabase
    .from("auto_vehicle_publications")
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

  // MOCK / SIMULADOR FALLBACK - RECHAZADO EN MODO ONLINE 100%
  return { success: false, error: "Conexión a " + channel + " no configurada en modo producción. Se requiere la integración online completa." };
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

export async function syncMercadoLibreListings() {
  const integrations = await getIntegrations();
  const ml = integrations.mercadolibre;

  if (!ml || !ml.connected) {
    return { success: false, error: "MercadoLibre no está conectado." };
  }

  if (ml.mode === 'production') {
    const token = await refreshMLToken();
    if (!token) return { success: false, error: "No se pudo renovar token de MercadoLibre" };

    try {
      const userRes = await fetch("https://api.mercadolibre.com/users/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const userData = await userRes.json();
      if (!userRes.ok) throw new Error(userData.message || "Error obteniendo perfil");

      const userId = userData.id;

      const searchRes = await fetch(`https://api.mercadolibre.com/users/${userId}/items/search?status=active`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const searchData = await searchRes.json();
      if (!searchRes.ok) throw new Error(searchData.message || "Error buscando publicaciones");

      const itemIds = searchData.results || [];
      const syncedPubs = [];
      const vehicles = await getVehicles("demo-agency-id");

      for (const itemId of itemIds) {
        const itemRes = await fetch(`https://api.mercadolibre.com/items/${itemId}`);
        const itemData = await itemRes.json();

        if (itemRes.ok) {
          const price = itemData.price;
          const matchingVehicle = vehicles.find((v: any) => v.price === price) || vehicles[0];

          syncedPubs.push({
            id: `pub-${itemData.id}`,
            vehicle_id: matchingVehicle ? matchingVehicle.id : "veh-1",
            channel: 'mercadolibre',
            status: 'published',
            external_url: itemData.permalink,
            views: itemData.visits || Math.floor(Math.random() * 80) + 10,
            questions_count: itemData.questions_count || 0,
            published_at: itemData.start_time || new Date().toISOString()
          });
        }
      }

      for (const pub of syncedPubs) {
        await (supabase.from("auto_vehicle_publications") as any).upsert(pub, { onConflict: "id" });
      }

      revalidatePath("/admin/integrations");
      return { success: true, count: syncedPubs.length };
    } catch (err: any) {
      console.error("Fallo al sincronizar publicaciones de MercadoLibre:", err);
      return { success: false, error: err.message || "Fallo en la comunicación con la API de MercadoLibre" };
    }
  }

  return { success: false, error: "Conexión a MercadoLibre no configurada en modo producción. Se requiere la integración online completa." };
}

// ==========================================
// INBOX & MESSAGING ACTIONS
// ==========================================

export async function getInboxConversations() {
  const db = getDb();
  let conversations = [...(db.inbox_conversations || [])];

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
              conversations = conversations.filter(c => c.channel !== "mercadolibre");

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

  const db = getDb();
  if (!db.inbox_conversations) db.inbox_conversations = [];

  const conversation = db.inbox_conversations.find((c: any) => c.id === conversationId);
  if (!conversation) {
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

  conversation.messages.push(newMsg);
  conversation.last_message = text;
  conversation.last_message_time = timeStr;
  conversation.unread = false;

  saveDb(db);
  revalidatePath("/admin/inbox");
  return { success: true, conversation };
}

export async function simulateLeadReply(conversationId: string, agentMessageText: string) {
  const db = getDb();
  if (!db.inbox_conversations) db.inbox_conversations = [];

  const conversation = db.inbox_conversations.find((c: any) => c.id === conversationId);
  if (!conversation) {
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

  conversation.messages.push(newMsg);
  conversation.last_message = replyText;
  conversation.last_message_time = timeStr;
  conversation.unread = true;

  saveDb(db);
  revalidatePath("/admin/inbox");
  return { success: true, conversation };
}

export async function markConversationRead(conversationId: string) {
  const db = getDb();
  if (!db.inbox_conversations) db.inbox_conversations = [];

  const conversation = db.inbox_conversations.find((c: any) => c.id === conversationId);
  if (conversation) {
    conversation.unread = false;
    saveDb(db);
    revalidatePath("/admin/inbox");
  }
  return { success: true };
}

export async function updateConversationNotes(conversationId: string, notes: string) {
  const db = getDb();
  if (!db.inbox_conversations) db.inbox_conversations = [];

  const conversation = db.inbox_conversations.find((c: any) => c.id === conversationId);
  if (conversation) {
    conversation.notes = notes;
    saveDb(db);
    revalidatePath("/admin/inbox");
  }
  return { success: true };
}
