"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminUpgradePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/settings?tab=planes");
  }, [router]);

  return (
    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-color)" }}>
      Redirigiendo a Configuración / Planes...
    </div>
  );
}
