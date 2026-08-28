"use server";

import { 
  getAllServerInquiries, 
  saveServerInquiry, 
  updateServerInquiryStatus, 
  deleteServerInquiry,
  ServerLandingInquiry 
} from "@/lib/serverInquiryStore";
import { revalidatePath } from "next/cache";

export async function submitLandingInquiryAction(data: {
  agencyName: string;
  userName: string;
  userEmail: string;
  phone?: string;
  message?: string;
}) {
  try {
    if (!data.agencyName || !data.userName || !data.userEmail) {
      return { success: false, error: "Faltan campos obligatorios." };
    }

    const saved = await saveServerInquiry({
      agencyName: data.agencyName,
      userName: data.userName,
      userEmail: data.userEmail,
      phone: data.phone,
      message: data.message
    });

    revalidatePath("/superadmin/requests");
    revalidatePath("/superadmin");

    return { success: true, inquiry: saved };
  } catch (e) {
    console.error("Error en submitLandingInquiryAction:", e);
    return { success: false, error: "Error interno en el servidor." };
  }
}

export async function fetchLandingInquiriesAction(): Promise<ServerLandingInquiry[]> {
  try {
    return await getAllServerInquiries();
  } catch (e) {
    console.error("Error en fetchLandingInquiriesAction:", e);
    return [];
  }
}

export async function updateInquiryStatusAction(id: string, status: ServerLandingInquiry["status"]) {
  try {
    const ok = await updateServerInquiryStatus(id, status);
    revalidatePath("/superadmin/requests");
    return { success: ok };
  } catch (e) {
    console.error("Error en updateInquiryStatusAction:", e);
    return { success: false };
  }
}

export async function deleteInquiryAction(id: string) {
  try {
    const ok = await deleteServerInquiry(id);
    revalidatePath("/superadmin/requests");
    return { success: ok };
  } catch (e) {
    console.error("Error en deleteInquiryAction:", e);
    return { success: false };
  }
}
