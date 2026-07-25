"use client";

export interface SupportMessage {
  id: string;
  sender: "user" | "superadmin";
  senderName: string;
  message: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  userEmail: string;
  userName: string;
  agencyName: string;
  subject: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  updatedAt: string;
  unreadSuperadmin: boolean;
  unreadUser: boolean;
  messages: SupportMessage[];
}

const SUPPORT_STORAGE_KEY = "n_sistemas_support_tickets_v1";

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: "ticket-101",
    userEmail: "mauricio@automotora.com",
    userName: "Mauricio Negrin",
    agencyName: "Test-Automotora",
    subject: "Consulta sobre integración con WhatsApp",
    status: "in_progress",
    createdAt: "2026-07-24T14:30:00Z",
    updatedAt: "2026-07-25T07:10:00Z",
    unreadSuperadmin: true,
    unreadUser: false,
    messages: [
      {
        id: "msg-1",
        sender: "user",
        senderName: "Mauricio Negrin",
        message: "Hola, quisiera saber cómo vincular el número de WhatsApp oficial de mi automotora para el Inbox.",
        timestamp: "2026-07-24 14:30"
      },
      {
        id: "msg-2",
        sender: "superadmin",
        senderName: "Superadmin",
        message: "¡Hola Mauricio! Puedes configurarlo ingresando a Configuración > Integraciones. Si precisas asistencia guiada dime y lo agendamos.",
        timestamp: "2026-07-24 15:00"
      },
      {
        id: "msg-3",
        sender: "user",
        senderName: "Mauricio Negrin",
        message: "Excelente, ¡muchas gracias! Ya lo estoy revisando.",
        timestamp: "2026-07-25 07:10"
      }
    ]
  }
];

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notify() {
  listeners.forEach(fn => fn());
}

export function subscribeSupport(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSupportTickets(): SupportTicket[] {
  if (typeof window === "undefined") return INITIAL_TICKETS;
  try {
    const saved = localStorage.getItem(SUPPORT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading support tickets:", e);
  }
  return INITIAL_TICKETS;
}

export function saveSupportTickets(tickets: SupportTicket[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SUPPORT_STORAGE_KEY, JSON.stringify(tickets));
      notify();
    } catch (e) {
      console.error("Error saving support tickets:", e);
    }
  }
}

export function createSupportTicket(userEmail: string, userName: string, agencyName: string, subject: string, initialMessage: string): SupportTicket {
  const tickets = getSupportTickets();
  const newTicket: SupportTicket = {
    id: `ticket-${Date.now()}`,
    userEmail,
    userName,
    agencyName,
    subject: subject || "Consulta General de Soporte",
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    unreadSuperadmin: true,
    unreadUser: false,
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: "user",
        senderName: userName,
        message: initialMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]
  };

  const updated = [newTicket, ...tickets];
  saveSupportTickets(updated);
  return newTicket;
}

export function addMessageToTicket(ticketId: string, sender: "user" | "superadmin", senderName: string, text: string): void {
  const tickets = getSupportTickets();
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);
  if (ticketIndex === -1) return;

  const ticket = tickets[ticketIndex];
  const newMsg: SupportMessage = {
    id: `msg-${Date.now()}`,
    sender,
    senderName,
    message: text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  ticket.messages.push(newMsg);
  ticket.updatedAt = new Date().toISOString();
  if (sender === "user") {
    ticket.unreadSuperadmin = true;
    ticket.unreadUser = false;
  } else {
    ticket.unreadUser = true;
    ticket.unreadSuperadmin = false;
  }

  tickets[ticketIndex] = ticket;
  saveSupportTickets(tickets);
}

export function markTicketAsRead(ticketId: string, by: "user" | "superadmin"): void {
  const tickets = getSupportTickets();
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);
  if (ticketIndex === -1) return;

  if (by === "superadmin") {
    tickets[ticketIndex].unreadSuperadmin = false;
  } else {
    tickets[ticketIndex].unreadUser = false;
  }
  saveSupportTickets(tickets);
}

export function updateTicketStatus(ticketId: string, status: "open" | "in_progress" | "resolved"): void {
  const tickets = getSupportTickets();
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);
  if (ticketIndex === -1) return;

  tickets[ticketIndex].status = status;
  tickets[ticketIndex].updatedAt = new Date().toISOString();
  saveSupportTickets(tickets);
}
