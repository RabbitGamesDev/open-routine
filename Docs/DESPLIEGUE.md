# Despliegue
1. **Repo + GitHub Pages**: sube el repo `open-routine`, Settings > Pages > rama `main` / root. HTTPS incluido.
2. **Worker** (carpeta `worker/`): `npm i -g wrangler && wrangler login` -> `wrangler secret put OPENROUTER_API_KEY` -> `wrangler deploy`. Copia la URL https.
3. Configura orígenes permitidos: `wrangler secret put ALLOWED_ORIGINS` con `https://TU-USUARIO.github.io,http://localhost:8080`.
4. En OpenRutine: Ajustes > Coach > pega la URL del Worker y activa. Prueba: `hola, que hago hoy?`
5. **Supabase (fase 2, opcional)**: SQL Editor > pega `supabase/schema.sql`. La integracion vive
   en `OR.sync.flush()` (unico punto a conectar; conflictos: gana updated_at mayor).
6. **PWA**: Chrome/Edge > instalar. Android: menu > "Anadir a pantalla de inicio".
   El SW solo cachea estaticos; nunca cachea Coach ni Supabase.
