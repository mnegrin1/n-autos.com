/**
 * Integración con Cloudflare for SaaS (Custom Hostnames API)
 * Permite registrar, consultar y eliminar dominios personalizados de los clientes.
 */

export interface CustomHostnameResult {
  id: string;
  hostname: string;
  status: 'active' | 'pending' | 'error';
  sslStatus: 'active' | 'pending_validation' | 'error';
  ownershipVerification?: {
    type: string;
    name: string;
    value: string;
  };
  sslVerification?: {
    type: string;
    name: string;
    value: string;
  };
  errors?: string[];
}

const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

/**
 * Registra un dominio de cliente en Cloudflare for SaaS.
 */
export async function createCustomHostname(hostname: string): Promise<CustomHostnameResult> {
  const cleanHostname = hostname.trim().toLowerCase().replace(/^https?:\/\//, '');

  if (!CLOUDFLARE_ZONE_ID || !CLOUDFLARE_API_TOKEN) {
    console.warn('[Cloudflare API] Falta CLOUDFLARE_ZONE_ID o CLOUDFLARE_API_TOKEN. Modo simulación activo.');
    return {
      id: `sim_${Date.now()}`,
      hostname: cleanHostname,
      status: 'pending',
      sslStatus: 'pending_validation',
      ownershipVerification: {
        type: 'cname',
        name: `_cf-custom-hostname.${cleanHostname}`,
        value: 'admin.n-autos.com',
      },
      sslVerification: {
        type: 'cname',
        name: `_acme-challenge.${cleanHostname}`,
        value: `${cleanHostname}.dcv.cloudflare.com`,
      },
    };
  }

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostname: cleanHostname,
          ssl: {
            method: 'http',
            type: 'dv',
          },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok || !data.success) {
      const errorMsgs = data.errors?.map((e: any) => e.message) || ['Error desconocido en Cloudflare'];
      throw new Error(errorMsgs.join(', '));
    }

    const result = data.result;
    return {
      id: result.id,
      hostname: result.hostname,
      status: result.status === 'active' ? 'active' : 'pending',
      sslStatus: result.ssl?.status || 'pending_validation',
      ownershipVerification: result.ownership_verification
        ? {
            type: result.ownership_verification.type || 'txt',
            name: result.ownership_verification.name,
            value: result.ownership_verification.value,
          }
        : undefined,
      sslVerification: result.ssl?.validation_records?.[0]
        ? {
            type: result.ssl.validation_records[0].type || 'cname',
            name: result.ssl.validation_records[0].txt_name || result.ssl.validation_records[0].cname_name,
            value: result.ssl.validation_records[0].txt_value || result.ssl.validation_records[0].cname_target,
          }
        : undefined,
    };
  } catch (err: any) {
    console.error('[Cloudflare API Error]:', err);
    throw err;
  }
}

/**
 * Consulta el estado actualizado de un dominio registrado en Cloudflare.
 */
export async function getCustomHostnameStatus(hostnameId: string): Promise<CustomHostnameResult> {
  if (!CLOUDFLARE_ZONE_ID || !CLOUDFLARE_API_TOKEN || hostnameId.startsWith('sim_')) {
    return {
      id: hostnameId,
      hostname: 'dominio-simulado.com',
      status: 'pending',
      sslStatus: 'pending_validation',
      ownershipVerification: {
        type: 'cname',
        name: '_cf-custom-hostname.dominio-simulado.com',
        value: 'admin.n-autos.com',
      },
    };
  }

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames/${hostnameId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.errors?.[0]?.message || 'Error al obtener estado en Cloudflare');
    }

    const result = data.result;
    return {
      id: result.id,
      hostname: result.hostname,
      status: result.status === 'active' ? 'active' : 'pending',
      sslStatus: result.ssl?.status || 'pending_validation',
    };
  } catch (err: any) {
    console.error('[Cloudflare API Fetch Status Error]:', err);
    throw err;
  }
}

/**
 * Elimina un dominio personalizado de Cloudflare.
 */
export async function deleteCustomHostname(hostnameId: string): Promise<boolean> {
  if (!CLOUDFLARE_ZONE_ID || !CLOUDFLARE_API_TOKEN || hostnameId.startsWith('sim_')) {
    return true;
  }

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames/${hostnameId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await res.json();
    return res.ok && data.success;
  } catch (err: any) {
    console.error('[Cloudflare API Delete Error]:', err);
    return false;
  }
}
