'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createCustomHostname, getCustomHostnameStatus, deleteCustomHostname } from '@/lib/cloudflare';

export interface DomainInfoResponse {
  subdomain: string | null;
  custom_domain: string | null;
  custom_domain_status: 'active' | 'pending' | 'error' | null;
  custom_domain_ssl_status: string | null;
  custom_domain_hostname_id: string | null;
  verification?: {
    cnameTarget: string;
    ownershipRecord?: { name: string; value: string };
    sslRecord?: { name: string; value: string };
  };
}

export async function getAgencyDomainInfo(agencyId: string): Promise<DomainInfoResponse> {
  const { data, error } = await (supabaseAdmin.from('agencies') as any)
    .select('subdomain, custom_domain, custom_domain_status, custom_domain_ssl_status, custom_domain_hostname_id')
    .eq('id', agencyId)
    .single();

  if (error || !data) {
    return {
      subdomain: null,
      custom_domain: null,
      custom_domain_status: null,
      custom_domain_ssl_status: null,
      custom_domain_hostname_id: null,
    };
  }

  const result: DomainInfoResponse = {
    subdomain: data.subdomain,
    custom_domain: data.custom_domain,
    custom_domain_status: data.custom_domain_status as any,
    custom_domain_ssl_status: data.custom_domain_ssl_status,
    custom_domain_hostname_id: data.custom_domain_hostname_id,
    verification: {
      cnameTarget: 'fallback.n-sistemas.com',
    },
  };

  return result;
}

export async function addCustomDomainAction(agencyId: string, rawDomain: string) {
  try {
    const cleanDomain = rawDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    
    if (!cleanDomain || !cleanDomain.includes('.')) {
      return { success: false, error: 'Por favor ingrese un nombre de dominio válido (ej: www.mi-automotora.com)' };
    }

    // Verificar si el dominio ya está registrado por otra agencia
    const { data: existing } = await (supabaseAdmin.from('agencies') as any)
      .select('id')
      .eq('custom_domain', cleanDomain)
      .neq('id', agencyId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'Este dominio ya se encuentra vinculado a otra cuenta en la plataforma.' };
    }

    // Registrar en Cloudflare for SaaS
    const cfResult = await createCustomHostname(cleanDomain);

    // Actualizar en Supabase
    const { error: updateErr } = await (supabaseAdmin.from('agencies') as any)
      .update({
        custom_domain: cleanDomain,
        custom_domain_status: cfResult.status,
        custom_domain_hostname_id: cfResult.id,
        custom_domain_ssl_status: cfResult.sslStatus,
      })
      .eq('id', agencyId);

    if (updateErr) {
      console.error('Error actualizando Supabase:', updateErr);
      return { success: false, error: 'No se pudo guardar la configuración del dominio en la base de datos.' };
    }

    return {
      success: true,
      data: {
        domain: cleanDomain,
        status: cfResult.status,
        sslStatus: cfResult.sslStatus,
        verification: {
          cnameTarget: 'fallback.n-sistemas.com',
          ownershipRecord: cfResult.ownershipVerification,
          sslRecord: cfResult.sslVerification,
        },
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al conectar el dominio' };
  }
}

export async function verifyCustomDomainAction(agencyId: string) {
  try {
    const { data: agency, error } = await (supabaseAdmin.from('agencies') as any)
      .select('custom_domain, custom_domain_hostname_id')
      .eq('id', agencyId)
      .single();

    if (error || !agency || !agency.custom_domain_hostname_id) {
      return { success: false, error: 'No hay un dominio personalizado registrado para esta cuenta.' };
    }

    const cfResult = await getCustomHostnameStatus(agency.custom_domain_hostname_id);

    // Actualizar estado en Supabase
    await (supabaseAdmin.from('agencies') as any)
      .update({
        custom_domain_status: cfResult.status,
        custom_domain_ssl_status: cfResult.sslStatus,
      })
      .eq('id', agencyId);

    return {
      success: true,
      status: cfResult.status,
      sslStatus: cfResult.sslStatus,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al verificar estado del dominio' };
  }
}

export async function removeCustomDomainAction(agencyId: string) {
  try {
    const { data: agency } = await (supabaseAdmin.from('agencies') as any)
      .select('custom_domain_hostname_id')
      .eq('id', agencyId)
      .single();

    if (agency?.custom_domain_hostname_id) {
      await deleteCustomHostname(agency.custom_domain_hostname_id);
    }

    await (supabaseAdmin.from('agencies') as any)
      .update({
        custom_domain: null,
        custom_domain_status: null,
        custom_domain_hostname_id: null,
        custom_domain_ssl_status: null,
      })
      .eq('id', agencyId);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al desvincular el dominio' };
  }
}
