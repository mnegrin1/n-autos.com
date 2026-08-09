<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:production-workflow-rules -->
# Reglas de Control de Versiones y Trabajo para Producción

1. **Análisis de Impacto y Planificación Previa**:
   - Antes de modificar componentes compartidos o realizar cambios significativos, analiza la estructura de dependencias y componentes afectados.
   - Propon o presenta un plan detallado antes de modificar archivos para evitar efectos secundarios en otras partes del sistema.

2. **Trabajo Aislado en Ramas**:
   - Todos los cambios deben realizarse y probarse en ramas secundarias (`feat/...`, `fix/...`). No realizar pruebas ni modificaciones directas sobre la rama de producción (`main`).

3. **Verificación Obligatoria de Compilación**:
   - Tras realizar modificaciones en el código, ejecuta siempre la compilación/verificación (`npm run build` o `npm run lint`) para certificar que no se rompan tipos en TypeScript ni exportaciones en Next.js.

4. **Preservación de Estados Estables**:
   - Garantizar checkpoints/commits estables antes de iterar en tareas complejas para permitir reversiones limpias si un cambio no resulta como se esperaba.
<!-- END:production-workflow-rules -->

