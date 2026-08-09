"use server";

import { updateAgencySettings } from "./agencyActions";
import { revalidatePath } from "next/cache";

export async function processApprovedBrandingRequest(params: {
  agencyId: string;
  newName: string;
  newSubdomain: string;
}) {
  try {
    const result = await updateAgencySettings(params.agencyId, {
      name: params.newName,
      subdomain: params.newSubdomain
    });

    revalidatePath("/");
    revalidatePath("/admin/settings");
    revalidatePath("/superadmin/requests");
    revalidatePath("/superadmin/agencies");
    revalidatePath("/portal/[agency]", "page");
    revalidatePath("/portal/[agency]", "layout");

    return {
      success: true,
      data: result.data
    };
  } catch (error: any) {
    console.error("Error al procesar la aprobación de cambio de branding:", error);
    return {
      success: false,
      error: error?.message || "Error al procesar el cambio de branding."
    };
  }
}
