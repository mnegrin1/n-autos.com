import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agencyId = searchParams.get("agencyId");
  const returnTo = searchParams.get("returnTo") || (agencyId ? "/admin/agenda" : "/superadmin/calendar");

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(
      new URL(`${returnTo}?error=google_client_id_missing`, request.url)
    );
  }

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google-calendar/callback`;

  const state = agencyId ? `agency_${agencyId}` : "superadmin";

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: [
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
      access_type: "offline",
      prompt: "consent",
      state,
    }).toString();

  return NextResponse.redirect(authUrl);
}
