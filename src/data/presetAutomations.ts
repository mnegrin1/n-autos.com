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
  category: "Recordatorio de Leads" | "Etiquetas y Tags" | "WhatsApp / Mensajería" | "Filtro / Asignación" | "Post-Venta y Fidelización";
  iconType: "clock" | "tag" | "message" | "user" | "zap" | "mail";
  trigger_event: string;
  trigger_event_label: string;
  default_action_type: "send_email" | "send_message" | "add_tag" | "notify_agent";
  default_action_label: string;
  usesTag: boolean;
  defaultTag: string;
  tagFieldLabel: string;
  actions: PresetStackedAction[];
}

export const PRESET_CATEGORIES = [
  "Todas",
  "Recordatorio de Leads",
  "Etiquetas y Tags",
  "WhatsApp / Mensajería",
  "Filtro / Asignación",
  "Post-Venta y Fidelización"
] as const;

export const PRESET_AUTOMATIONS: PresetAutomation[] = [
  {
    id: "preset-1",
    title: "Recordatorio: Lead Sin Contactar (>24hs)",
    description: "Genera una alerta directa por WhatsApp al vendedor asignado cuando un nuevo lead no ha recibido respuesta comercial en 24 horas.",
    category: "Recordatorio de Leads",
    iconType: "clock",
    trigger_event: "lead_no_contact_24h",
    trigger_event_label: "Lead sin respuesta > 24hs",
    default_action_type: "notify_agent",
    default_action_label: "Alerta Prioritaria Vendedor",
    usesTag: true,
    defaultTag: "Urgente Atención",
    tagFieldLabel: "Etiqueta para identificar el lead",
    actions: [
      {
        id: "act-1a",
        type: "notify_agent",
        value: "Alerta Urgente al Vendedor",
        details: { channel: "WhatsApp" }
      },
      {
        id: "act-1b",
        type: "add_tag",
        value: "Asignar Tag 'Urgente Atención'",
        details: { tag: "Urgente Atención" }
      }
    ]
  },
  {
    id: "preset-2",
    title: "Bienvenida Automática por WhatsApp a Lead Nuevo",
    description: "Envía un mensaje instantáneo de saludo por WhatsApp a cualquier prospecto que ingrese desde la web o redes sociales.",
    category: "WhatsApp / Mensajería",
    iconType: "message",
    trigger_event: "lead_created",
    trigger_event_label: "Nuevo Lead Registrado",
    default_action_type: "send_message",
    default_action_label: "WhatsApp de Saludo Inicial",
    usesTag: true,
    defaultTag: "Lead Nuevo",
    tagFieldLabel: "Etiqueta asignada al nuevo lead",
    actions: [
      {
        id: "act-2a",
        type: "send_message",
        value: "WhatsApp: Bienvenida a la Automotora",
        details: { channel: "WhatsApp", body: "¡Hola {{nombre}}! Gracias por comunicarte con nuestra automotora. ¿Qué modelo o tipo de vehículo estás buscando?" }
      },
      {
        id: "act-2b",
        type: "add_tag",
        value: "Asignar Tag 'Lead Nuevo'",
        details: { tag: "Lead Nuevo" }
      }
    ]
  },
  {
    id: "preset-3",
    title: "Etiquetar Lead de Alto Valor / Inversor VIP",
    description: "Asigna una etiqueta VIP y notifica al Gerente Comercial cuando el presupuesto declarado del cliente supera los $30.000 USD.",
    category: "Etiquetas y Tags",
    iconType: "tag",
    trigger_event: "lead_budget_high",
    trigger_event_label: "Presupuesto > $30.000 USD",
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
    title: "Recordatorio de Agendamiento de Test Drive",
    description: "Envía un recordatorio por WhatsApp 2 horas antes de la prueba de manejo agendada con la ubicación exacta del local.",
    category: "Recordatorio de Leads",
    iconType: "clock",
    trigger_event: "test_drive_scheduled",
    trigger_event_label: "Test Drive Agendado",
    default_action_type: "send_message",
    default_action_label: "WhatsApp Recordatorio Cita",
    usesTag: true,
    defaultTag: "Test Drive Pendiente",
    tagFieldLabel: "Etiqueta del estado de prueba",
    actions: [
      {
        id: "act-4a",
        type: "send_message",
        value: "WhatsApp: Confirmación de Cita Test Drive",
        details: { channel: "WhatsApp", body: "Hola {{nombre}}, te recordamos tu Test Drive agendado para hoy. Te dejamos nuestra dirección en GPS." }
      },
      {
        id: "act-4b",
        type: "add_tag",
        value: "Asignar Tag 'Test Drive Pendiente'",
        details: { tag: "Test Drive Pendiente" }
      }
    ]
  },
  {
    id: "preset-5",
    title: "Seguimiento a Solicitud de Financiación",
    description: "Envía automáticamente por email la lista de documentación requerida para la aprobación de crédito prendario.",
    category: "Recordatorio de Leads",
    iconType: "mail",
    trigger_event: "finance_requested",
    trigger_event_label: "Consulta por Crédito / Financiación",
    default_action_type: "send_email",
    default_action_label: "Email con Requisitos de Crédito",
    usesTag: true,
    defaultTag: "Solicitud Crédito",
    tagFieldLabel: "Etiqueta para solicitudes de crédito",
    actions: [
      {
        id: "act-5a",
        type: "send_email",
        value: "Email: Requisitos de Crédito Prendario",
        details: { subject: "Requisitos para tu Crédito Prendario", body: "Hola {{nombre}}, adjuntamos la documentación requerida para aprobar tu financiación." }
      },
      {
        id: "act-5b",
        type: "add_tag",
        value: "Asignar Tag 'Solicitud Crédito'",
        details: { tag: "Solicitud Crédito" }
      }
    ]
  },
  {
    id: "preset-6",
    title: "Alerta de Permuta / Vehículo en Parte de Pago",
    description: "Identifica cuando un prospecto consulta ofreciendo su auto usado y notifica al área de tasaciones de la automotora.",
    category: "Filtro / Asignación",
    iconType: "user",
    trigger_event: "trade_in_offered",
    trigger_event_label: "Usado en Parte de Pago",
    default_action_type: "add_tag",
    default_action_label: "Asignar Tag Permuta + Notificar Tasador",
    usesTag: true,
    defaultTag: "Permuta Pendiente",
    tagFieldLabel: "Etiqueta para gestión de usados",
    actions: [
      {
        id: "act-6a",
        type: "add_tag",
        value: "Asignar Tag 'Permuta Pendiente'",
        details: { tag: "Permuta Pendiente" }
      },
      {
        id: "act-6b",
        type: "notify_agent",
        value: "Notificar a Mesa de Tasación",
        details: {}
      }
    ]
  },
  {
    id: "preset-7",
    title: "Re-engagement de Leads Inactivos (30 Días)",
    description: "Reactiva prospectos fríos que no registran interacción en 30 días enviando novedades del stock disponible.",
    category: "Post-Venta y Fidelización",
    iconType: "message",
    trigger_event: "lead_inactive_30d",
    trigger_event_label: "Inactividad comercial de 30 días",
    default_action_type: "send_message",
    default_action_label: "WhatsApp de Reactivación",
    usesTag: true,
    defaultTag: "Reactivación 30d",
    tagFieldLabel: "Etiqueta para campaña de reactivación",
    actions: [
      {
        id: "act-7a",
        type: "send_message",
        value: "WhatsApp: Catálogo Actualizado de Oportunidades",
        details: { channel: "WhatsApp", body: "Hola {{nombre}}, renovamos nuestro inventario de autos seminuevos esta semana. ¿Aún estás buscando vehículo?" }
      },
      {
        id: "act-7b",
        type: "add_tag",
        value: "Asignar Tag 'Reactivación 30d'",
        details: { tag: "Reactivación 30d" }
      }
    ]
  },
  {
    id: "preset-8",
    title: "Asignación Automática por Marca de Interés",
    description: "Segmenta automáticamente al cliente asignándole la etiqueta de la marca que está consultando (Toyota, VW, Chevrolet, etc.).",
    category: "Filtro / Asignación",
    iconType: "user",
    trigger_event: "brand_inquiry",
    trigger_event_label: "Consulta por Marca Específica",
    default_action_type: "add_tag",
    default_action_label: "Asignar Tag de Marca",
    usesTag: true,
    defaultTag: "Interés Toyota",
    tagFieldLabel: "Etiqueta de la marca consultada",
    actions: [
      {
        id: "act-8a",
        type: "add_tag",
        value: "Asignar Tag 'Interés Toyota'",
        details: { tag: "Interés Toyota" }
      }
    ]
  },
  {
    id: "preset-9",
    title: "Marcar Lead como 'Lead Caliente 🔥'",
    description: "Identifica prospectos con alta intención de compra que han realizado más de 3 consultas en 48 horas.",
    category: "Etiquetas y Tags",
    iconType: "tag",
    trigger_event: "high_intent_detected",
    trigger_event_label: "Alta Intención de Compra (>3 consultas)",
    default_action_type: "add_tag",
    default_action_label: "Asignar Tag Lead Caliente",
    usesTag: true,
    defaultTag: "Lead Caliente 🔥",
    tagFieldLabel: "Etiqueta para prioridad máxima",
    actions: [
      {
        id: "act-9a",
        type: "add_tag",
        value: "Asignar Tag 'Lead Caliente 🔥'",
        details: { tag: "Lead Caliente 🔥" }
      },
      {
        id: "act-9b",
        type: "notify_agent",
        value: "Alerta Prioritaria al Vendedor",
        details: {}
      }
    ]
  },
  {
    id: "preset-10",
    title: "Encuesta de Satisfacción Post-Entrega de Vehículo",
    description: "Envía un mensaje de felicitaciones y solicitud de opinión en Google 3 días después de la entrega del automóvil.",
    category: "Post-Venta y Fidelización",
    iconType: "message",
    trigger_event: "car_delivered",
    trigger_event_label: "Vehículo Entregado al Cliente",
    default_action_type: "send_message",
    default_action_label: "WhatsApp Felicitación + Reseña",
    usesTag: true,
    defaultTag: "Cliente Feliz 0km",
    tagFieldLabel: "Etiqueta cliente post-entrega",
    actions: [
      {
        id: "act-10a",
        type: "send_message",
        value: "WhatsApp: Encuesta y Reseña Post-Venta",
        details: { channel: "WhatsApp", body: "¡Felicitaciones {{nombre}} por tu nuevo vehículo! Nos encantaría que nos dejes tu opinión sobre la atención recibida." }
      },
      {
        id: "act-10b",
        type: "add_tag",
        value: "Asignar Tag 'Cliente Feliz 0km'",
        details: { tag: "Cliente Feliz 0km" }
      }
    ]
  },
  {
    id: "preset-11",
    title: "Recordatorio de Service 10.000 KM / Mantenimiento",
    description: "Envía un aviso automático por WhatsApp 6 meses después de la compra para agendar el mantenimiento preventivo.",
    category: "Post-Venta y Fidelización",
    iconType: "clock",
    trigger_event: "service_due_6m",
    trigger_event_label: "6 Meses Post-Entrega",
    default_action_type: "send_message",
    default_action_label: "WhatsApp Recordatorio Service",
    usesTag: true,
    defaultTag: "Service Pendiente",
    tagFieldLabel: "Etiqueta agenda de mantenimiento",
    actions: [
      {
        id: "act-11a",
        type: "send_message",
        value: "WhatsApp: Recordatorio Turno Service Oficial",
        details: { channel: "WhatsApp", body: "Hola {{nombre}}, se acerca la fecha del primer service oficial de tu vehículo (10.000 km). Reserva tu turno aquí." }
      },
      {
        id: "act-11b",
        type: "add_tag",
        value: "Asignar Tag 'Service Pendiente'",
        details: { tag: "Service Pendiente" }
      }
    ]
  },
  {
    id: "preset-12",
    title: "Alerta de Vencimiento de Reserva / Seña de Unidad",
    description: "Avisa al vendedor y al cliente 24hs antes del vencimiento del periodo de reserva congelada del stock.",
    category: "Recordatorio de Leads",
    iconType: "clock",
    trigger_event: "reservation_expiring_24h",
    trigger_event_label: "Reserva a 24hs de vencer",
    default_action_type: "notify_agent",
    default_action_label: "Alerta Vencimiento Seña",
    usesTag: true,
    defaultTag: "Reserva Vencimiento",
    tagFieldLabel: "Etiqueta para aviso de reserva",
    actions: [
      {
        id: "act-12a",
        type: "notify_agent",
        value: "Alerta Vendedor por Reserva por Vencer",
        details: {}
      },
      {
        id: "act-12b",
        type: "add_tag",
        value: "Asignar Tag 'Reserva Vencimiento'",
        details: { tag: "Reserva Vencimiento" }
      }
    ]
  },
  {
    id: "preset-13",
    title: "Respuesta Automática Fuera de Horario Comercial",
    description: "Envía un mensaje de cortesía nocturno informando que el equipo responderá a primera hora de la mañana.",
    category: "WhatsApp / Mensajería",
    iconType: "message",
    trigger_event: "after_hours_message",
    trigger_event_label: "Consulta recibida entre 20:00 y 08:00 hs",
    default_action_type: "send_message",
    default_action_label: "WhatsApp Respuesta Nocturna",
    usesTag: true,
    defaultTag: "Fuera de Horario",
    tagFieldLabel: "Etiqueta consultas fuera de hora",
    actions: [
      {
        id: "act-13a",
        type: "send_message",
        value: "WhatsApp: Autotexto Horario No Laboral",
        details: { channel: "WhatsApp", body: "Hola {{nombre}}, recibimos tu consulta fuera de nuestro horario de atención. Te responderemos a primera hora de la mañana." }
      },
      {
        id: "act-13b",
        type: "add_tag",
        value: "Asignar Tag 'Fuera de Horario'",
        details: { tag: "Fuera de Horario" }
      }
    ]
  },
  {
    id: "preset-14",
    title: "Recordatorio de Renovación de Seguro Automotor",
    description: "Ofrece la renovación de la póliza de seguro 30 días antes del vencimiento anual de la unidad vendida.",
    category: "Post-Venta y Fidelización",
    iconType: "mail",
    trigger_event: "insurance_expiring_30d",
    trigger_event_label: "Seguro Vence en 30 Días",
    default_action_type: "send_email",
    default_action_label: "Email Cotización Seguro",
    usesTag: true,
    defaultTag: "Renovación Seguro",
    tagFieldLabel: "Etiqueta seguro por vencer",
    actions: [
      {
        id: "act-14a",
        type: "send_email",
        value: "Email: Propuesta Cotización Seguro",
        details: { subject: "Renovación de Seguro Automotor", body: "Hola {{nombre}}, tu póliza anual vence en 30 días. Conoce nuestros descuentos de renovación." }
      },
      {
        id: "act-14b",
        type: "add_tag",
        value: "Asignar Tag 'Renovación Seguro'",
        details: { tag: "Renovación Seguro" }
      }
    ]
  },
  {
    id: "preset-15",
    title: "Aviso de Rebaja de Precio en Vehículo Interesado",
    description: "Envía un aviso de oportunidad por WhatsApp cuando el precio de un auto publicado disminuye para los leads interesados.",
    category: "WhatsApp / Mensajería",
    iconType: "zap",
    trigger_event: "vehicle_price_drop",
    trigger_event_label: "Bajada de Precio en Stock",
    default_action_type: "send_message",
    default_action_label: "WhatsApp Alerta Rebaja",
    usesTag: true,
    defaultTag: "Interesado Oferta",
    tagFieldLabel: "Etiqueta interesados en rebaja",
    actions: [
      {
        id: "act-15a",
        type: "send_message",
        value: "WhatsApp: Alerta Oportunidad Descuento",
        details: { channel: "WhatsApp", body: "¡Atención {{nombre}}! El vehículo por el que habías consultado acaba de bajar de precio. ¡Aprovecha la oportunidad!" }
      },
      {
        id: "act-15b",
        type: "add_tag",
        value: "Asignar Tag 'Interesado Oferta'",
        details: { tag: "Interesado Oferta" }
      }
    ]
  },
  {
    id: "preset-16",
    title: "Etiquetar y Archivar Lead Descalificado",
    description: "Asigna etiqueta de cierre y remueve avisos de seguimiento cuando el cliente indica que ya no está interesado.",
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
        id: "act-16a",
        type: "add_tag",
        value: "Asignar Tag 'No Interesado'",
        details: { tag: "No Interesado" }
      }
    ]
  },
  {
    id: "preset-17",
    title: "Checklist de Documentación para Transferencia",
    description: "Envía por email los documentos requeridos (Título, Cédula, Verificación, 08) para cerrar la transferencia del auto.",
    category: "Recordatorio de Leads",
    iconType: "mail",
    trigger_event: "sale_pending_docs",
    trigger_event_label: "Transferencia en Proceso Documental",
    default_action_type: "send_email",
    default_action_label: "Email Checklist Documentación",
    usesTag: true,
    defaultTag: "Papelería Pendiente",
    tagFieldLabel: "Etiqueta trámite transferencia",
    actions: [
      {
        id: "act-17a",
        type: "send_email",
        value: "Email: Checklist de Documentos Requeridos",
        details: { subject: "Documentación para Transferencia de Titularidad", body: "Hola {{nombre}}, te adjuntamos el listado de documentos necesarios para completar la transferencia." }
      },
      {
        id: "act-17b",
        type: "add_tag",
        value: "Asignar Tag 'Papelería Pendiente'",
        details: { tag: "Papelería Pendiente" }
      }
    ]
  },
  {
    id: "preset-18",
    title: "Escalado por Vendedor Inactivo (>4 Horas)",
    description: "Reasigna el prospecto al vendedor de guardia si no registra acción comercial en 4 horas hábiles.",
    category: "Filtro / Asignación",
    iconType: "user",
    trigger_event: "agent_unresponsive_4h",
    trigger_event_label: "Lead sin acción por 4 horas hábiles",
    default_action_type: "notify_agent",
    default_action_label: "Reasignar a Vendedor Guardia",
    usesTag: true,
    defaultTag: "Reasignado Urgente",
    tagFieldLabel: "Etiqueta para lead reasignado",
    actions: [
      {
        id: "act-18a",
        type: "notify_agent",
        value: "Notificación Reasignación a Guardia",
        details: {}
      },
      {
        id: "act-18b",
        type: "add_tag",
        value: "Asignar Tag 'Reasignado Urgente'",
        details: { tag: "Reasignado Urgente" }
      }
    ]
  },
  {
    id: "preset-19",
    title: "Etiquetar Origen Facebook / Instagram Ads",
    description: "Asigna automáticamente la etiqueta de campaña de anuncios de Meta para medir el retorno publicitario de cada canal.",
    category: "Etiquetas y Tags",
    iconType: "tag",
    trigger_event: "meta_ads_lead",
    trigger_event_label: "Ingreso por Campaña Meta Ads",
    default_action_type: "add_tag",
    default_action_label: "Asignar Tag Meta Ads",
    usesTag: true,
    defaultTag: "Meta Ads Lead",
    tagFieldLabel: "Etiqueta para origen de anuncios",
    actions: [
      {
        id: "act-19a",
        type: "add_tag",
        value: "Asignar Tag 'Meta Ads Lead'",
        details: { tag: "Meta Ads Lead" }
      }
    ]
  },
  {
    id: "preset-20",
    title: "Felicitación de Cumpleaños + Beneficio en Service",
    description: "Envía un mensaje de felicitación por WhatsApp en la fecha de cumpleaños del cliente con un descuento en accesorios o taller.",
    category: "Post-Venta y Fidelización",
    iconType: "message",
    trigger_event: "client_birthday",
    trigger_event_label: "Fecha de Cumpleaños del Cliente",
    default_action_type: "send_message",
    default_action_label: "WhatsApp Saludo + Descuento",
    usesTag: true,
    defaultTag: "Cumpleaños VIP",
    tagFieldLabel: "Etiqueta beneficio de cumpleaños",
    actions: [
      {
        id: "act-20a",
        type: "send_message",
        value: "WhatsApp: Felicitación + Cupón Descuento",
        details: { channel: "WhatsApp", body: "¡Feliz Cumpleaños {{nombre}}! De parte de todo el equipo de la automotora te regalamos un 20% OFF en tu próximo service." }
      },
      {
        id: "act-20b",
        type: "add_tag",
        value: "Asignar Tag 'Cumpleaños VIP'",
        details: { tag: "Cumpleaños VIP" }
      }
    ]
  },
  {
    id: "preset-21",
    title: "Confirmación Instantánea de Reserva de Unidad",
    description: "Notifica por WhatsApp al cliente que su seña fue acreditada con éxito y que la unidad ha sido congelada en el inventario.",
    category: "WhatsApp / Mensajería",
    iconType: "message",
    trigger_event: "deposit_confirmed",
    trigger_event_label: "Seña / Reserva Acreditada",
    default_action_type: "send_message",
    default_action_label: "WhatsApp Recibo Reserva",
    usesTag: true,
    defaultTag: "Unidad Reservada",
    tagFieldLabel: "Etiqueta confirmación de reserva",
    actions: [
      {
        id: "act-21a",
        type: "send_message",
        value: "WhatsApp: Recibo y Congelamiento de Stock",
        details: { channel: "WhatsApp", body: "¡Reserva Confirmada {{nombre}}! Tu seña ha sido registrada correctamente y el vehículo se encuentra congelado a tu nombre." }
      },
      {
        id: "act-21b",
        type: "add_tag",
        value: "Asignar Tag 'Unidad Reservada'",
        details: { tag: "Unidad Reservada" }
      }
    ]
  }
];
