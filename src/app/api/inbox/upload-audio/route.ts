import { NextResponse } from "next/server";
import { uploadAudioBuffer } from "@/actions/storageActions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("audio") as File | null;
    const rawDuration = formData.get("duration");
    const duration = rawDuration ? parseFloat(rawDuration.toString()) : 0;

    if (!file || typeof file !== "object" || file.size === 0) {
      return NextResponse.json(
        { success: false, error: "No se proporcionó ningún archivo de audio válido" },
        { status: 400 }
      );
    }

    const mimeType = file.type || "audio/webm";
    let ext = "webm";
    if (mimeType.includes("mp4") || mimeType.includes("m4a")) ext = "m4a";
    else if (mimeType.includes("mpeg") || mimeType.includes("mp3")) ext = "mp3";
    else if (mimeType.includes("ogg")) ext = "ogg";
    else if (mimeType.includes("wav")) ext = "wav";

    const fileName = file.name && file.name.includes(".") ? file.name : `voice_${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const relativeOrPublicUrl = await uploadAudioBuffer(buffer, fileName, mimeType, "inbox_audio");

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const absoluteUrl = relativeOrPublicUrl.startsWith("http")
      ? relativeOrPublicUrl
      : `${protocol}://${host}${relativeOrPublicUrl}`;

    return NextResponse.json({
      success: true,
      url: relativeOrPublicUrl,
      absoluteUrl: absoluteUrl,
      duration: Math.round(duration)
    });
  } catch (error: any) {
    console.error("Error en /api/inbox/upload-audio:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al procesar el audio" },
      { status: 500 }
    );
  }
}
