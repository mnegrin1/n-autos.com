"use client";

import { useEffect } from "react";

export default function PortalFaviconScript({ 
  logoUrl, 
  agencyName 
}: { 
  logoUrl?: string; 
  agencyName?: string; 
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (agencyName && agencyName.trim() !== "") {
      document.title = agencyName;
    }

    if (logoUrl && logoUrl.trim() !== "") {
      // Remove all existing default icons from head to force browser update
      const existingIcons = document.querySelectorAll("link[rel*='icon'], link[rel*='shortcut'], link[rel*='apple-touch-icon']");
      existingIcons.forEach(el => el.remove());

      const newLink = document.createElement("link");
      newLink.rel = "icon";
      newLink.type = "image/x-icon";
      newLink.href = logoUrl;
      document.head.appendChild(newLink);

      const shortcutLink = document.createElement("link");
      shortcutLink.rel = "shortcut icon";
      shortcutLink.href = logoUrl;
      document.head.appendChild(shortcutLink);
    }
  }, [logoUrl, agencyName]);

  return null;
}
