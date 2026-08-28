import os
from pathlib import Path

# Buscar recursivamente todos los archivos de página y ruta en Next.js
for path in Path("src/app").rglob("*"):
    if path.name in ["page.tsx", "route.ts"]:
        content = path.read_text(encoding="utf-8")
        # Si no tiene ya configurado el runtime
        if "runtime =" not in content:
            print(f"Configurando Edge Runtime en: {path}")
            lines = content.splitlines()
            insert_idx = 0
            # Si el archivo empieza con "use client" o "use server", insertar en la siguiente línea
            if lines and ("use client" in lines[0] or "use server" in lines[0]):
                insert_idx = 1
            lines.insert(insert_idx, 'export const runtime = "edge";')
            path.write_text("\n".join(lines), encoding="utf-8")