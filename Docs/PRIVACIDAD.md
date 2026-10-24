# Politica de privacidad — OpenRutine (borrador v1.0)
**Responsable**: [COMPLETAR antes de publicar: nombre/apodo y correo de contacto].

1. **Datos locales**: tareas, rutinas, ocurrencias, resultados y registros academicos se guardan
   en IndexedDB de TU dispositivo. Solo tu tienes acceso.
2. **Sincronizacion**: en modo local nada sale del dispositivo. Con Supabase (fase 2), los datos
   viven en tu cuenta protegida por Row Level Security.
3. **Coach IA**: solo se envian al Worker las areas marcadas en Ajustes > Privacidad del Coach
   (nunca notas privadas ni registros familiares). El Worker (Cloudflare) reenvia el mensaje a
   OpenRouter con la clave secreta del servidor. Revisa la politica de OpenRouter.
4. **Proveedores**: GitHub Pages (estaticos), Cloudflare Workers (proxy del Coach),
   OpenRouter (modelo de IA), Supabase (opcional).
5. **Tus derechos**: exporta todo en Ajustes > Datos (JSON). Para eliminar: borra los datos del
   sitio en tu navegador y, si usas Supabase, elimina tu cuenta desde su panel.
6. **Sin conexion**: la app funciona completa offline; el Coach requiere red.
7. **Limitaciones**: sin cifrado extremo a extremo propio (se apoya en HTTPS y politicas de los
   proveedores). Sin certificaciones auditadas.
