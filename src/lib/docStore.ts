"use client";

import { getCurrentClientSession } from "@/lib/sessionHelper";

export interface DocSection {
  id: string; // e.g. "marca-logo"
  title: string;
  description: string;
  content: string;
  loomUrl?: string; // e.g. "https://www.loom.com/share/..." or "https://www.loom.com/embed/..."
  order: number;
}

export interface DocPage {
  slug: string; // e.g. "configuracion-inicial"
  title: string;
  category: string;
  iconName?: string;
  summary: string;
  sections: DocSection[];
  createdAt: string;
  updatedAt: string;
}

export interface DocComment {
  id: string;
  docSlug: string;
  sectionId?: string;
  authorName: string;
  authorRole: string; // e.g. "Super Admin", "Fundador", "Administrador", "Vendedor"
  authorEmail?: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
}

const DOC_PAGES_KEY = "n_sistemas_doc_pages_v1";
const DOC_COMMENTS_KEY = "n_sistemas_doc_comments_v1";

// Default documentation pages for CRM configuration
export const DEFAULT_DOC_PAGES: DocPage[] = [
  {
    slug: "configuracion-inicial",
    title: "Configuración Inicial y Perfil de Agencia",
    category: "Primeros Pasos",
    iconName: "Settings",
    summary: "Guía paso a paso para configurar los datos principales de la automotora, logo, horarios, moneda oficial y subdominio.",
    createdAt: "2026-08-01",
    updatedAt: "2026-08-09",
    sections: [
      {
        id: "datos-marca-logo",
        title: "1. Identidad de la Automotora y Logo",
        description: "Establece la imagen institucional que verán tus clientes en el sitio web y cotizaciones.",
        content: `Para personalizar la identidad de tu negocio:
1. Ve a **Configuración > Perfil de la Automotora**.
2. Completa el **Nombre Comercial** y la Razón Social.
3. Sube el **Logo oficial** en formato PNG o SVG con fondo transparente.
4. Ajusta el **Favicon** que se mostrará en las pestañas del navegador de tus clientes.

*Tip:* Un logo con dimensiones recomendadas de 400x100px asegura una visualización óptima tanto en modo claro como en modo oscuro.`,
        loomUrl: "https://www.loom.com/share/e2494fd97a9145899479b18cb6ed6874",
        order: 1
      },
      {
        id: "monedas-sucursales",
        title: "2. Moneda de Operación y Sucursales",
        description: "Configura si tus precios se publican en USD, UYU o múltiples monedas.",
        content: `En la sección de **Configuración General**:
- Selecciona la **Moneda Principal** predeterminada para el inventario (Dólares USD o Pesos UYU).
- Si cuentas con múltiples locales de venta, puedes añadir tus **Sucursales** indicando la dirección exacta, teléfono de contacto y mapa interactivo.`,
        loomUrl: "https://www.loom.com/share/e2494fd97a9145899479b18cb6ed6874",
        order: 2
      },
      {
        id: "subdominio-web",
        title: "3. Enlace del Sitio Web y Subdominio",
        description: "Publica tu catálogo web instantáneamente bajo tu nombre de automotora.",
        content: `Tu catálogo web público queda activo de forma inmediata en:
\`https://tuautomotora.n-autos.com\`

Si deseas vincular tu dominio propio (ejemplo: \`www.automotoracarmax.com\`), dirígete al módulo de **Sitio Web > Dominio Personalizado** para ingresar tus registros CNAME o DNS.`,
        loomUrl: "",
        order: 3
      }
    ]
  },
  {
    slug: "gestion-vehiculos",
    title: "Gestión de Inventario y Vehículos",
    category: "Inventario",
    iconName: "Car",
    summary: "Aprende a registrar vehículos, cargar galerías de imágenes en alta resolución, actualizar precios y gestionar estados del stock.",
    createdAt: "2026-08-01",
    updatedAt: "2026-08-09",
    sections: [
      {
        id: "alta-vehiculo",
        title: "1. Publicación de un Nuevo Vehículo",
        description: "Carga rápida de autos, camionetas y motos en tu catálogo.",
        content: `Pasos para dar de alta un vehículo:
1. Haz clic en el botón **"+ Nuevo Vehículo"** en la barra superior o en **Inventario Stock**.
2. Ingresa **Marca, Modelo, Año, Kilometraje y Tipo de Transmisión**.
3. Selecciona la **Categoría de Carrocería** (Sedán, SUV, Pickup, Hatchback).
4. Asigna el **Precio de Venta** en la moneda correspondiente y opcionalmente un **Precio de Oferta**.`,
        loomUrl: "https://www.loom.com/share/e2494fd97a9145899479b18cb6ed6874",
        order: 1
      },
      {
        id: "galeria-fotos",
        title: "2. Carga y Ordenamiento de Galería HD",
        description: "Sube hasta 30 fotos por vehículo y define la portada principal.",
        content: `El CRM optimiza automáticamente la calidad y el peso de las fotografías subidas.
- Arrastra y suelta múltiples fotos simultáneamente.
- La primera imagen en la lista se establece automáticamente como **Portada Principal**.
- Puedes reordenar las fotos simplemente arrastrándolas en el editor.`,
        loomUrl: "",
        order: 2
      },
      {
        id: "estados-inventario",
        title: "3. Estados del Vehículo (Disponible, Reservado, Vendido)",
        description: "Control total sobre la disponibilidad de tu inventario.",
        content: `Mantén actualizado el flujo de tus unidades:
- **Disponible**: Se muestra en la web pública y se sincroniza con portales.
- **Reservado**: Muestra una insignia de reserva impidiendo nuevas señas.
- **Vendido**: Se retira de los portales activos y se archiva registrando la venta en tus métricas.`,
        loomUrl: "",
        order: 3
      }
    ]
  },
  {
    slug: "integracion-whatsapp",
    title: "Integración con WhatsApp CRM y Respuestas Rápidas",
    category: "Comunicación",
    iconName: "MessageSquare",
    summary: "Conecta tu WhatsApp comercial para recibir consultas de la web, asignar chats a vendedores y responder en segundos.",
    createdAt: "2026-08-02",
    updatedAt: "2026-08-09",
    sections: [
      {
        id: "vinculacion-whatsapp",
        title: "1. Vinculación del Número de WhatsApp",
        description: "Conecta tu número comercial para centralizar los mensajes.",
        content: `Para conectar tu línea:
1. Ve a **Integraciones > WhatsApp**.
2. Escanea el código QR desde tu aplicación de WhatsApp Business.
3. Una vez conectado, las consultas generadas desde la web o fichas de vehículos llegarán directamente al **Inbox CRM**.`,
        loomUrl: "https://www.loom.com/share/e2494fd97a9145899479b18cb6ed6874",
        order: 1
      },
      {
        id: "plantillas-respuestas",
        title: "2. Plantillas de Mensaje y Respuestas Automáticas",
        description: "Agiliza la atención inicial enviando fichas de vehículos al instante.",
        content: `Crea respuestas prediseñadas en **Configuración > Plantillas WhatsApp**:
- Envío automático de la ficha del auto con 1 clic.
- Saludos fuera de horario de atención.
- Mensajes de confirmación para agendar visitas o Test Drive.`,
        loomUrl: "",
        order: 2
      }
    ]
  },
  {
    slug: "gestion-leads",
    title: "Gestión de Leads y Embudo de Ventas",
    category: "Ventas",
    iconName: "Users",
    summary: "Organiza tus prospectos en un tablero Kanban, califica su interés, programa tareas de seguimiento y cierra operaciones.",
    createdAt: "2026-08-02",
    updatedAt: "2026-08-09",
    sections: [
      {
        id: "tablero-kanban",
        title: "1. El Embudo de Ventas Kanban",
        description: "Visualiza de un vistazo en qué etapa está cada cliente interesado.",
        content: `Las columnas del tablero representan el viaje del comprador:
- **Nuevo Lead**: Consultas recién ingresadas desde el sitio web o portales.
- **Contactado**: Primer intercambio de mensajes o llamada realizada.
- **Test Drive / Visita**: El cliente agendó una prueba del vehículo.
- **Negociación**: En proceso de crédito, permuta o entrega de seña.
- **Vendido / Ganado**: Negocio cerrado con éxito.`,
        loomUrl: "https://www.loom.com/share/e2494fd97a9145899479b18cb6ed6874",
        order: 1
      },
      {
        id: "asignacion-vendedores",
        title: "2. Asignación de Vendedores y Tareas",
        description: "Asigna responsables y evita que se pierda ninguna oportunidad.",
        content: `Dentro del detalle de cada lead:
- Asigna un **Vendedor Responsable**.
- Agrega **Notas Internas** privadas (ejemplo: *"Ofrece permuta Gol 2018"*).
- Programa **Tareas de Seguimiento** con recordatorios por fecha y hora.`,
        loomUrl: "",
        order: 2
      }
    ]
  },
  {
    slug: "publicacion-portales",
    title: "Sincronización con Portales y Mercado Libre",
    category: "Multicanal",
    iconName: "Globe",
    summary: "Publica automáticamente tu stock de vehículos en Mercado Libre, redes sociales y exportaciones masivas.",
    createdAt: "2026-08-03",
    updatedAt: "2026-08-09",
    sections: [
      {
        id: "conexion-mercadolibre",
        title: "1. Integración OAuth con Mercado Libre",
        description: "Sincroniza tus autos con tu cuenta oficial de Mercado Libre Autos.",
        content: `1. En **Integraciones > Mercado Libre**, haz clic en **"Conectar Cuenta"**.
2. Inicia sesión con tus credenciales de Mercado Libre para otorgar autorización.
3. Activa la sincronización automática: cualquier cambio de precio o estado en el CRM se actualizará en tiempo real en Mercado Libre.`,
        loomUrl: "https://www.loom.com/share/e2494fd97a9145899479b18cb6ed6874",
        order: 1
      }
    ]
  },
  {
    slug: "automatizaciones",
    title: "Automatización de Emails y Campañas",
    category: "Marketing",
    iconName: "Zap",
    summary: "Configura secuencias de correos automáticos de nutrición de leads para reactivar interesados y fidelizar clientes.",
    createdAt: "2026-08-04",
    updatedAt: "2026-08-09",
    sections: [
      {
        id: "triggers-email",
        title: "1. Reglas de Disparo y Disparadores Automáticos",
        description: "Envía emails personalizados según la acción que realice el prospecto.",
        content: `En **Automatizaciones**:
- Define el evento desencadenante (ejemplo: *"Lead sin respuesta por 3 días"*).
- Elige la plantilla de email a enviar con etiquetas dinámicas como \`{{nombre_cliente}}\` y \`{{vehiculo_interes}}\`.
- Revisa las estadísticas de tasa de apertura y clics de tus campañas.`,
        loomUrl: "",
        order: 1
      }
    ]
  },
  {
    slug: "usuarios-permisos",
    title: "Usuarios, Vendedores y Control de Permisos",
    category: "Administración",
    iconName: "ShieldCheck",
    summary: "Agrega miembros a tu equipo de ventas, asigna roles de acceso y restringe permisos por usuario o sucursal.",
    createdAt: "2026-08-04",
    updatedAt: "2026-08-09",
    sections: [
      {
        id: "roles-equipo",
        title: "1. Creación de Usuarios e Invitaciones",
        description: "Invita a administradores, gerentes de ventas y vendedores.",
        content: `Desde **Configuración > Usuarios**:
1. Haz clic en **"+ Invitar Usuario"**.
2. Ingresa el correo electrónico y asigna el **Rol**:
   - **Administrador de Agencia**: Acceso total a configuración, reportes e inventario.
   - **Vendedor / Agente**: Acceso únicamente a sus leads asignados e inventario stock.
3. El usuario recibirá un enlace para crear su contraseña.`,
        loomUrl: "",
        order: 1
      }
    ]
  }
];

export const DEFAULT_DOC_COMMENTS: DocComment[] = [
  {
    id: "comment-1",
    docSlug: "configuracion-inicial",
    sectionId: "datos-marca-logo",
    authorName: "Mauricio Negrin",
    authorRole: "Super Admin",
    authorEmail: "admin@n-autos.com",
    avatarUrl: "",
    content: "¡Hola equipo! En este video muestro detalladamente cómo subir el logo en formato vectorial para que se vea perfecto en monitores Retina y en dispositivos móviles. Cualquier duda me la dejan por aquí.",
    createdAt: "2026-08-08 10:30"
  },
  {
    id: "comment-2",
    docSlug: "configuracion-inicial",
    sectionId: "datos-marca-logo",
    authorName: "Juan Pérez",
    authorRole: "Administrador de Agencia (CarMax)",
    authorEmail: "juan@carmax.com",
    avatarUrl: "",
    content: "Excelente explicación Mauricio. Ya subimos nuestro logo PNG con fondo transparente y quedó impecable en la web oficial.",
    createdAt: "2026-08-08 14:15"
  },
  {
    id: "comment-3",
    docSlug: "integracion-whatsapp",
    sectionId: "vinculacion-whatsapp",
    authorName: "Carlos Rodríguez",
    authorRole: "Gerente de Ventas",
    authorEmail: "carlos@delsur.com",
    avatarUrl: "",
    content: "¿Es posible vincular dos números de WhatsApp diferentes si tenemos dos sucursales de la automotora?",
    createdAt: "2026-08-09 09:00"
  },
  {
    id: "comment-4",
    docSlug: "integracion-whatsapp",
    sectionId: "vinculacion-whatsapp",
    authorName: "Mauricio Negrin",
    authorRole: "Super Admin",
    authorEmail: "admin@n-autos.com",
    avatarUrl: "",
    content: "¡Hola Carlos! Sí, en el plan Multi-Sucursal puedes vincular un número de WhatsApp independiente por cada sucursal.",
    createdAt: "2026-08-09 09:20"
  }
];

// Helper listeners for reactive state updates across tabs & components
type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeDocStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Detection of user role & Super Admin status
export function getActiveUserSessionInfo() {
  if (typeof window === "undefined") {
    return {
      isLoggedIn: false,
      isSuperAdmin: false,
      userName: "Usuario Invitado",
      userEmail: "",
      userRole: "Invitado",
      agencyName: ""
    };
  }

  const session = getCurrentClientSession();
  
  if (!session) {
    return {
      isLoggedIn: false,
      isSuperAdmin: false,
      userName: "Invitado",
      userEmail: "",
      userRole: "Invitado (Lectura)",
      agencyName: ""
    };
  }

  const role = (session.role || "").toLowerCase();
  const email = (session.email || "").toLowerCase();
  const name = session.name || session.email || "Usuario";
  const agency = session.agencyName || session.agency || "Automotora";

  const isSuperAdmin =
    role === "superadmin" ||
    role === "super_admin" ||
    email.includes("admin@n-autos.com") ||
    email.includes("mauricio") ||
    session.isSuperAdmin === true;

  return {
    isLoggedIn: true,
    isSuperAdmin,
    userName: name,
    userEmail: email,
    userRole: isSuperAdmin ? "Super Admin (Modo Edición)" : (session.role || "Integrante de Organización"),
    agencyName: agency
  };
}

// Data store functions for Pages
export function getDocPages(): DocPage[] {
  if (typeof window === "undefined") return DEFAULT_DOC_PAGES;
  try {
    const saved = localStorage.getItem(DOC_PAGES_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading doc pages from localStorage:", e);
  }
  return DEFAULT_DOC_PAGES;
}

export function getDocPageBySlug(slug: string): DocPage | null {
  const pages = getDocPages();
  return pages.find((p) => p.slug === slug) || null;
}

export function saveDocPage(page: DocPage): void {
  if (typeof window === "undefined") return;
  try {
    const pages = getDocPages();
    const index = pages.findIndex((p) => p.slug === page.slug);
    let updatedPages: DocPage[];
    
    const pageWithTimestamp = {
      ...page,
      updatedAt: new Date().toISOString().split("T")[0]
    };

    if (index !== -1) {
      updatedPages = [...pages];
      updatedPages[index] = pageWithTimestamp;
    } else {
      updatedPages = [...pages, pageWithTimestamp];
    }

    localStorage.setItem(DOC_PAGES_KEY, JSON.stringify(updatedPages));
    notify();
  } catch (e) {
    console.error("Error saving doc page:", e);
  }
}

export function deleteDocPage(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    const pages = getDocPages();
    const updated = pages.filter((p) => p.slug !== slug);
    localStorage.setItem(DOC_PAGES_KEY, JSON.stringify(updated));
    notify();
  } catch (e) {
    console.error("Error deleting doc page:", e);
  }
}

// Data store functions for Comments
export function getDocComments(docSlug: string, sectionId?: string): DocComment[] {
  let allComments: DocComment[] = DEFAULT_DOC_COMMENTS;
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(DOC_COMMENTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          allComments = parsed;
        }
      }
    } catch (e) {
      console.error("Error reading comments from localStorage:", e);
    }
  }

  return allComments.filter((c) => {
    if (c.docSlug !== docSlug) return false;
    if (sectionId && c.sectionId && c.sectionId !== sectionId) return false;
    return true;
  });
}

export function addDocComment(commentData: {
  docSlug: string;
  sectionId?: string;
  authorName: string;
  authorRole: string;
  authorEmail?: string;
  content: string;
}): DocComment {
  const newComment: DocComment = {
    id: `comment-${Date.now()}`,
    docSlug: commentData.docSlug,
    sectionId: commentData.sectionId,
    authorName: commentData.authorName,
    authorRole: commentData.authorRole,
    authorEmail: commentData.authorEmail,
    content: commentData.content,
    createdAt: new Date().toLocaleString("es-UY", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    })
  };

  if (typeof window !== "undefined") {
    try {
      let currentComments: DocComment[] = DEFAULT_DOC_COMMENTS;
      const saved = localStorage.getItem(DOC_COMMENTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) currentComments = parsed;
      }
      const updated = [newComment, ...currentComments];
      localStorage.setItem(DOC_COMMENTS_KEY, JSON.stringify(updated));
      notify();
    } catch (e) {
      console.error("Error adding comment:", e);
    }
  }

  return newComment;
}

export function deleteDocComment(commentId: string): void {
  if (typeof window === "undefined") return;
  try {
    let currentComments: DocComment[] = DEFAULT_DOC_COMMENTS;
    const saved = localStorage.getItem(DOC_COMMENTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) currentComments = parsed;
    }
    const updated = currentComments.filter((c) => c.id !== commentId);
    localStorage.setItem(DOC_COMMENTS_KEY, JSON.stringify(updated));
    notify();
  } catch (e) {
    console.error("Error deleting comment:", e);
  }
}
