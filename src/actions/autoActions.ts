"use server";

import { getDb, saveDb } from "@/lib/localDb";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { vehicleSchema, autoLeadSchema } from "@/lib/schemas";

// Helper to save files to public/uploads
async function saveUploadedFiles(files: any[]): Promise<{ images: string[], videos: string[] }> {
  const images: string[] = [];
  const videos: string[] = [];
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  await fs.mkdir(uploadDir, { recursive: true });

  for (const file of files) {
    if (file && typeof file === "object" && file.size > 0 && file.name) {
      try {
        const isImg = file.type.startsWith("image/");
        const prefix = isImg ? "img" : "vid";
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${prefix}-${file.name.replace(/\s+/g, "-")}`;
        const filePath = path.join(uploadDir, filename);
        await fs.writeFile(filePath, buffer);
        
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
  const db = getDb();
  if (!db.integrations) {
    db.integrations = {
      mercadolibre: { connected: false, username: "", token: "" },
      facebook: { connected: false, pageName: "", token: "" },
      instagram: { connected: false, handle: "" },
      whatsapp: { connected: false, phoneNumber: "" }
    };
  }
  return db.integrations;
}

export async function updateIntegration(
  channel: 'mercadolibre' | 'facebook' | 'instagram' | 'whatsapp',
  connected: boolean,
  data?: any
) {
  const db = getDb();
  if (!db.integrations) {
    db.integrations = {
      mercadolibre: { connected: false, username: "", token: "" },
      facebook: { connected: false, pageName: "", token: "" },
      instagram: { connected: false, handle: "" },
      whatsapp: { connected: false, phoneNumber: "" }
    };
  }

  if (channel === 'mercadolibre') {
    db.integrations.mercadolibre = {
      connected,
      username: connected ? (data?.username || "Automotora Demo ML") : "",
      token: connected ? (data?.token || "TEST-ML-TOKEN-123456") : ""
    };
  } else if (channel === 'facebook') {
    db.integrations.facebook = {
      connected,
      pageName: connected ? (data?.pageName || "Automotora Fanpage") : "",
      token: connected ? (data?.token || "TEST-FB-TOKEN-123456") : ""
    };
  } else if (channel === 'instagram') {
    db.integrations.instagram = {
      connected,
      handle: connected ? (data?.handle || "@automotora_demo") : ""
    };
  } else if (channel === 'whatsapp') {
    db.integrations.whatsapp = {
      connected,
      phoneNumber: connected ? (data?.phoneNumber || "+598 99 123 456") : ""
    };
  }

  saveDb(db);
  revalidatePath("/admin/integrations");
  revalidatePath("/admin/inbox");
  return { success: true, integrations: db.integrations };
}

export async function getVehiclePublications() {
  const db = getDb();
  return db.vehicle_publications || [];
}

// Helper to refresh MercadoLibre Access Token
export async function refreshMLToken() {
  const db = getDb();
  const ml = db.integrations?.mercadolibre;
  if (!ml || !ml.connected) return null;

  const appId = process.env.MERCADOLIBRE_APP_ID;
  const secretKey = process.env.MERCADOLIBRE_SECRET_KEY;

  // Si no está configurada la app en producción o no hay refresh token, no se puede hacer refresh
  if (!appId || !secretKey || !(ml as any).refreshToken || (ml as any).mode !== "production") {
    return ml.token || null; // Retornar el token simulado existente o null
  }

  // Si aún no expira (con margen de 5 minutos), usar el actual
  const expiresAt = (ml as any).expiresAt || 0;
  if (Date.now() < expiresAt - 5 * 60 * 1000) {
    return ml.token || null;
  }

  try {
    console.log("Renovando Access Token de MercadoLibre...");
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
        refresh_token: (ml as any).refreshToken
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Error al refrescar token");

    // Guardar los nuevos tokens (refresh token es de único uso)
    if (db.integrations?.mercadolibre) {
      db.integrations.mercadolibre.token = data.access_token;
      (db.integrations.mercadolibre as any).refreshToken = data.refresh_token;
      (db.integrations.mercadolibre as any).expiresAt = Date.now() + (data.expires_in * 1000);
      saveDb(db);
    }

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
  const db = getDb();
  if (!db.vehicle_publications) db.vehicle_publications = [];

  // Verificar si ya existe
  const existing = db.vehicle_publications.find((p: any) => p.vehicle_id === vehicleId && p.channel === channel);
  if (existing) {
    existing.status = 'published';
    saveDb(db);
    revalidatePath("/admin/integrations");
    return { success: true, data: existing };
  }

  const vehicle = db.vehicles?.find((v: any) => v.id === vehicleId);
  if (!vehicle) {
    return { success: false, error: "Vehículo no encontrado en inventario" };
  }

  // Si el canal es MercadoLibre y es en modo producción
  if (channel === 'mercadolibre' && db.integrations?.mercadolibre?.connected && (db.integrations.mercadolibre as any).mode === 'production') {
    const token = await refreshMLToken();
    if (!token) {
      return { success: false, error: "No se pudo obtener el token de MercadoLibre o está expirado" };
    }

    try {
      // Registrar publicación real en MercadoLibre Automotores (Clasificados Uruguay)
      const payload = {
        title: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
        category_id: "MLU1744", // Categoría de Autos y Camionetas en Uruguay (MLU)
        price: vehicle.price,
        currency_id: vehicle.currency || "USD",
        available_quantity: 1,
        buying_mode: "classified",
        listing_type_id: "silver", // Oro, Plata, Bronce
        condition: "used",
        description: {
          plain_text: vehicle.description || "Concesionario Oficial Automotora"
        },
        pictures: vehicle.images.map((imgUrl: string) => {
          // ML requiere URLs absolutas accesibles por internet.
          // Si es local /uploads, ML no lo podrá descargar, por lo que usamos una imagen de prueba de Unsplash
          const absoluteUrl = imgUrl.startsWith("http") 
            ? imgUrl 
            : `https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80`;
          return { source: absoluteUrl };
        }),
        attributes: [
          { id: "BRAND", value_name: vehicle.brand },
          { id: "MODEL", value_name: vehicle.model },
          { id: "VEHICLE_YEAR", value_name: vehicle.year.toString() },
          { id: "KILOMETERS", value_name: `${vehicle.kms} km` }
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

      const newPub = {
        id: `pub-${data.id}`,
        vehicle_id: vehicleId,
        channel,
        status: 'published' as const,
        external_url: data.permalink, // Enlace real a la publicación
        views: 0,
        questions_count: 0,
        published_at: new Date().toISOString()
      };

      db.vehicle_publications.push(newPub);
      saveDb(db);
      revalidatePath("/admin/integrations");
      return { success: true, data: newPub };
    } catch (err: any) {
      console.error("Error al publicar en ML producción:", err);
      return { success: false, error: err.message || "Fallo al comunicar con la API de MercadoLibre" };
    }
  }

  // MOCK / SIMULADOR FALLBACK
  const newPub = {
    id: `pub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    vehicle_id: vehicleId,
    channel,
    status: 'published' as const,
    external_url: channel === 'mercadolibre'
      ? `https://articulo.mercadolibre.com.uy/MLU-simulado-${vehicleId}`
      : channel === 'facebook'
        ? `https://facebook.com/concesionario-simulado/posts/${vehicleId}`
        : `https://instagram.com/p/simulado-${vehicleId}`,
    views: Math.floor(Math.random() * 50) + 12,
    questions_count: channel === 'mercadolibre' ? Math.floor(Math.random() * 3) : 0,
    published_at: new Date().toISOString()
  };

  db.vehicle_publications.push(newPub);
  saveDb(db);
  revalidatePath("/admin/integrations");
  return { success: true, data: newPub };
}

export async function unpublishVehicle(vehicleId: string, channel: 'mercadolibre' | 'facebook' | 'instagram') {
  const db = getDb();
  if (!db.vehicle_publications) db.vehicle_publications = [];

  const index = db.vehicle_publications.findIndex((p: any) => p.vehicle_id === vehicleId && p.channel === channel);
  if (index !== -1) {
    db.vehicle_publications.splice(index, 1);
    saveDb(db);
  }

  revalidatePath("/admin/integrations");
  return { success: true };
}

export async function syncMercadoLibreListings() {
  const db = getDb();
  const ml = db.integrations?.mercadolibre;

  if (!ml || !ml.connected) {
    return { success: false, error: "MercadoLibre no está conectado." };
  }

  // MODO PRODUCCIÓN REAL
  if ((ml as any).mode === 'production') {
    const token = await refreshMLToken();
    if (!token) return { success: false, error: "No se pudo renovar token de MercadoLibre" };

    try {
      // 1. Obtener el ID de usuario autenticado
      const userRes = await fetch("https://api.mercadolibre.com/users/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const userData = await userRes.json();
      if (!userRes.ok) throw new Error(userData.message || "Error obteniendo perfil");

      const userId = userData.id;

      // 2. Buscar las publicaciones activas del vendedor
      const searchRes = await fetch(`https://api.mercadolibre.com/users/${userId}/items/search?status=active`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const searchData = await searchRes.json();
      if (!searchRes.ok) throw new Error(searchData.message || "Error buscando publicaciones");

      const itemIds = searchData.results || [];
      const syncedPubs = [];

      // 3. Obtener detalles de cada publicación
      for (const itemId of itemIds) {
        const itemRes = await fetch(`https://api.mercadolibre.com/items/${itemId}`);
        const itemData = await itemRes.json();

        if (itemRes.ok) {
          // Intentar vincular con un auto del CRM
          const price = itemData.price;
          const matchingVehicle = db.vehicles?.find((v: any) => v.price === price) || db.vehicles?.[0];

          syncedPubs.push({
            id: `pub-${itemData.id}`,
            vehicle_id: matchingVehicle ? matchingVehicle.id : "veh-1",
            channel: 'mercadolibre' as const,
            status: 'published' as const,
            external_url: itemData.permalink,
            views: itemData.visits || Math.floor(Math.random() * 80) + 10,
            questions_count: itemData.questions_count || 0,
            published_at: itemData.start_time || new Date().toISOString()
          });
        }
      }

      // Mezclar con publicaciones existentes (reemplazar duplicados)
      if (!db.vehicle_publications) db.vehicle_publications = [];
      const otherPubs = db.vehicle_publications.filter((p: any) => p.channel !== 'mercadolibre');
      db.vehicle_publications = [...otherPubs, ...syncedPubs];
      saveDb(db);

      revalidatePath("/admin/integrations");
      return { success: true, count: syncedPubs.length };
    } catch (err: any) {
      console.error("Fallo al sincronizar publicaciones de MercadoLibre:", err);
      return { success: false, error: err.message || "Fallo en la comunicación con la API de MercadoLibre" };
    }
  }

  // MODO SIMULACIÓN LOCAL
  if (!db.vehicle_publications) db.vehicle_publications = [];

  const syncMockPubs = [
    {
      id: "pub-MLU400123456",
      vehicle_id: "veh-1", // Cruze
      channel: 'mercadolibre' as const,
      status: 'published' as const,
      external_url: "https://articulo.mercadolibre.com.uy/MLU-400123456-chevrolet-cruze-2022",
      views: 145,
      questions_count: 3,
      published_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "pub-MLU400987654",
      vehicle_id: "veh-2", // Hilux
      channel: 'mercadolibre' as const,
      status: 'published' as const,
      external_url: "https://articulo.mercadolibre.com.uy/MLU-400987654-toyota-hilux-2020",
      views: 312,
      questions_count: 5,
      published_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString()
    }
  ];

  const otherPubs = db.vehicle_publications.filter((p: any) => p.channel !== 'mercadolibre');
  db.vehicle_publications = [...otherPubs, ...syncMockPubs];
  saveDb(db);

  revalidatePath("/admin/integrations");
  return { success: true, count: syncMockPubs.length };
}

// ==========================================
// INBOX & MESSAGING ACTIONS
// ==========================================

export async function getInboxConversations() {
  const db = getDb();
  return db.inbox_conversations || [];
}

export async function sendInboxMessage(conversationId: string, text: string) {
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
