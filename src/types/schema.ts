export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          primary_color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          primary_color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          primary_color?: string | null
          created_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          agency_id: string
          title: string
          description: string | null
          type: 'casa' | 'apartamento' | 'local' | 'terreno'
          operation: 'venta' | 'alquiler'
          price: number
          currency: 'USD' | 'UYU' | 'ARS'
          status: 'disponible' | 'vendida' | 'alquilada' | 'reservada'
          bedrooms: number | null
          bathrooms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          title: string
          description?: string | null
          type: 'casa' | 'apartamento' | 'local' | 'terreno'
          operation: 'venta' | 'alquiler'
          price: number
          currency?: 'USD' | 'UYU' | 'ARS'
          status?: 'disponible' | 'vendida' | 'alquilada' | 'reservada'
          bedrooms?: number | null
          bathrooms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          title?: string
          description?: string | null
          type?: 'casa' | 'apartamento' | 'local' | 'terreno'
          operation?: 'venta' | 'alquiler'
          price?: number
          currency?: 'USD' | 'UYU' | 'ARS'
          status?: 'disponible' | 'vendida' | 'alquilada' | 'reservada'
          bedrooms?: number | null
          bathrooms?: number | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          agency_id: string
          name: string
          email: string
          role: 'admin' | 'manager' | 'agent'
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          name: string
          email: string
          role?: 'admin' | 'manager' | 'agent'
          created_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          name?: string
          email?: string
          role?: 'admin' | 'manager' | 'agent'
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          agency_id: string
          title: string
          description: string | null
          event_type: 'visita' | 'reunion' | 'llamada'
          event_date: string
          property_id: string | null
          agent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          title: string
          description?: string | null
          event_type: 'visita' | 'reunion' | 'llamada'
          event_date: string
          property_id?: string | null
          agent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          title?: string
          description?: string | null
          event_type?: 'visita' | 'reunion' | 'llamada'
          event_date?: string
          property_id?: string | null
          agent_id?: string | null
          created_at?: string
        }
      }
      offers: {
        Row: {
          id: string
          agency_id: string
          property_id: string
          client_name: string
          amount: number
          status: 'pendiente' | 'contraoferta' | 'aceptada' | 'rechazada'
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          property_id: string
          client_name: string
          amount: number
          status?: 'pendiente' | 'contraoferta' | 'aceptada' | 'rechazada'
          created_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          property_id?: string
          client_name?: string
          amount?: number
          status?: 'pendiente' | 'contraoferta' | 'aceptada' | 'rechazada'
          created_at?: string
        }
      }
    }
  }
}
