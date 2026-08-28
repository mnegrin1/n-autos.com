export interface PresetActionDetail {
  subject?: string;
  body?: string;
  channel?: "WhatsApp" | "SMS";
  tag?: string;
}

export interface PresetStackedAction {
  id: string;
  type: "send_email" | "send_message" | "add_tag" | "notify_agent";
  value: string;
  details: PresetActionDetail;
}

export interface PresetAutomation {
  id: string;
  title: string;
  description: string;
  category: "Mensajes de Bienvenida" | "Etiquetas y Tags";
  iconType: "clock" | "tag" | "message" | "user" | "zap" | "mail";
  trigger_event: string;
  trigger_event_label: string;
  default_action_type: "send_email" | "send_message" | "add_tag" | "notify_agent";
  default_action_label: string;
  usesTag: boolean;
  defaultTag: string;
  tagFieldLabel: string;
  defaultMessage?: string;
  actions: PresetStackedAction[];
}

export const PRESET_CATEGORIES = [
  "Todas",
  "Mensajes de Bienvenida",
  "Etiquetas y Tags"
] as const;

export const PRESET_AUTOMATIONS: PresetAutomation[] = [
  {
    id: "preset-1",
    title: "Bienvenida Automática por WhatsApp a Lead Nuevo",
    description: "Envía un mensaje instantáneo de saludo profesional por WhatsApp a cualquier prospecto que ingrese desde la web o redes sociales.",
    category: "Mensajes de Bienvenida",
    iconType: "message",
    trigger_event: "lead_created",
    trigger_event_label: "Nuevo Lead Registrado",
    default_action_type: "send_message",
    default_action_label: "WhatsApp de Saludo Inicial",
    usesTag: true,
    defaultTag: "Lead Nuevo",
    tagFieldLabel: "Etiqueta asignada al nuevo lead",
    defaultMessage: "¡Hola {{nombre}}! Gracias por contactar a nuestra automotora. ¿Buscás algún vehículo o modelo en particular? Dejanos tu consulta y un asesor te responderá a la brevedad.",
    actions: [
      {
        id: "act-1a",
        type: "send_message",
        value: "WhatsApp: Bienvenida a la Automotora",
        details: { 
          channel: "WhatsApp", 
          body: "¡Hola {{nombre}}! Gracias por contactar a nuestra automotora. ¿Buscás algún vehículo o modelo en particular? Dejanos tu consulta y un asesor te responderá a la brevedad." 
        }
      },
      {
        id: "act-1b",
        type: "add_tag",
        value: "Asignar Tag 'Lead Nuevo'",
        details: { tag: "Lead Nuevo" }
      }
    ]
  },
  {
    id: "preset-2",
    title: "Respuesta Automática Fuera de Horario Comercial",
    description: "Envía un mensaje de cortesía informando que el equipo comercial responderá a primera hora de la mañana.",
    category: "Mensajes de Bienvenida",
    iconType: "clock",
    trigger_event: "after_hours_message",
    trigger_event_label: "Consulta recibida fuera de hora",
    default_action_type: "send_message",
    default_action_label: "WhatsApp Respuesta Nocturna",
    usesTag: true,
    defaultTag: "Fuera de Horario",
    tagFieldLabel: "Etiqueta consultas fuera de hora",
    defaultMessage: "¡Hola {{nombre}}! Recibimos tu consulta fuera de nuestro horario de atención comercial. Te contactaremos a primera hora para brindarte toda la información del vehículo.",
    actions: [
      {
        id: "act-2a",
        type: "send_message",
        value: "WhatsApp: Autotexto Horario No Laboral",
        details: { 
          channel: "WhatsApp", 
          body: "¡Hola {{nombre}}! Recibimos tu consulta fuera de nuestro horario de atención comercial. Te contactaremos a primera hora para brindarte toda la información del vehículo." 
        }
      },
      {
        id: "act-2b",
        type: "add_tag",
        value: "Asignar Tag 'Fuera de Horario'",
        details: { tag: "Fuera de Horario" }
      }
    ]
  },
  {
    id: "preset-3",
    title: "Etiquetar Lead de Alto Valor / Inversor VIP",
    description: "Asigna la etiqueta VIP y notifica al Gerente Comercial cuando el presupuesto declarado del cliente es elevado.",
    category: "Etiquetas y Tags",
    iconType: "tag",
    trigger_event: "lead_budget_high",
    trigger_event_label: "Presupuesto Alto / VIP",
    default_action_type: "add_tag",
    default_action_label: "Asignar Tag VIP + Notificar Gerente",
    usesTag: true,
    defaultTag: "Inversor VIP",
    tagFieldLabel: "Etiqueta VIP a aplicar",
    actions: [
      {
        id: "act-3a",
        type: "add_tag",
        value: "Asignar Tag 'Inversor VIP'",
        details: { tag: "Inversor VIP" }
      },
      {
        id: "act-3b",
        type: "notify_agent",
        value: "Notificar a Gerencia Comercial",
        details: {}
      }
    ]
  },
  {
    id: "preset-4",
    title: "Etiquetar Origen Facebook / Instagram Ads",
    description: "Asigna automáticamente la etiqueta de campaña Meta Ads para identificar prospectos provenientes de anuncios.",
    category: "Etiquetas y Tags",
    iconType: "tag",
    trigger_event: "meta_ads_lead",
    trigger_event_label: "Ingreso por Meta Ads",
    default_action_type: "add_tag",
    default_action_label: "Asignar Tag Meta Ads",
    usesTag: true,
    defaultTag: "Meta Ads Lead",
    tagFieldLabel: "Etiqueta para origen de anuncios",
    actions: [
      {
        id: "act-4a",
        type: "add_tag",
        value: "Asignar Tag 'Meta Ads Lead'",
        details: { tag: "Meta Ads Lead" }
      }
    ]
  },
  {
    id: "preset-5",
    title: "Asignación Automática por Marca de Interés",
    description: "Segmenta al cliente asignándole la etiqueta de la marca que está consultando (Toyota, Volkswagen, Chevrolet, etc.).",
    category: "Etiquetas y Tags",
    iconType: "user",
    trigger_event: "brand_inquiry",
    trigger_event_label: "Consulta por Marca Específica",
    default_action_type: "add_tag",
    default_action_label: "Asignar Tag de Marca",
    usesTag: true,
    defaultTag: "Interés Específico",
    tagFieldLabel: "Etiqueta de la marca consultada",
    actions: [
      {
        id: "act-5a",
        type: "add_tag",
        value: "Asignar Tag 'Interés Específico'",
        details: { tag: "Interés Específico" }
      }
    ]
  },
  {
    id: "preset-6",
    title: "Etiquetar Lead Descalificado / No Interesado",
    description: "Asigna etiqueta de cierre cuando el cliente indica que ya no busca vehículo o no está interesado.",
    category: "Etiquetas y Tags",
    iconType: "tag",
    trigger_event: "lead_disqualified",
    trigger_event_label: "Lead Descalificado por Vendedor",
    default_action_type: "add_tag",
    default_action_label: "Asignar Tag Descalificado",
    usesTag: true,
    defaultTag: "No Interesado",
    tagFieldLabel: "Etiqueta para descalificados",
    actions: [
      {
        id: "act-6a",
        type: "add_tag",
        value: "Asignar Tag 'No Interesado'",
        details: { tag: "No Interesado" }
      }
    ]
  }
];
