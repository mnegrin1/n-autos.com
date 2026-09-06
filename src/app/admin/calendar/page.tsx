import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CalendarRedirectPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.searchParams;
  const q = new URLSearchParams();

  if (params) {
    for (const [key, val] of Object.entries(params)) {
      if (typeof val === "string") {
        q.set(key, val);
      } else if (Array.isArray(val) && val.length > 0) {
        q.set(key, val[0]);
      }
    }
  }

  const queryStr = q.toString();
  redirect(`/admin/agenda${queryStr ? `?${queryStr}` : ""}`);
}
