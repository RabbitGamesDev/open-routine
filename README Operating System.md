# OpenRutine — Personal Operating System

PWA offline-first sin frameworks pesados. Decisiones clave:

| Decision | Por que |
|---|---|
| HTML/CSS/JS modular ES2022 | ThinkPad con 97% disco: cero build step, cero node_modules |
| IndexedDB (no localStorage) para datos | Estructuras, consultas, cola futura de sync |
| Chart.js | Libreria de graficas mas ligera con tooltips/leyendas reales |
| Sin GSAP | Animaciones CSS cubren el 100% de los casos; menos peso |
| GitHub Pages + Cloudflare Worker + Supabase (fase 2) | Gratis, serverless, la key de IA jamas en el frontend |

## Ejecutar
Abre `index.html` directo, o mejor: `npx serve .` (o `python -m http.server 8080`).
En el movil: misma Wi-Fi, `http://TU-IP:8080`. Enlace Movil / Phone Link para verlo en tu PC.

## Estructura
- `js/db.js` IndexedDB · `js/store.js` capa de datos · `js/recurrence.js` motor de recurrencia
- `js/engine.js` prioridades + modos del dia · `js/gamification.js` XP/logros/rachas flexibles
- `js/views.js` las 9 vistas · `js/router.js` navegacion · `js/onboarding.js` bienvenida
- `worker/` backend del Coach · `supabase/schema.sql` · `docs/` despliegue y privacidad

## Verificado (revision estatica + coherencia de contratos entre modulos)
CRUD tareas persistente · subtareas · kanban/lista · recurrencia (daily/weekdays/interval,
anti-duplicados por routineId+date, posponer sin romper plantilla) · modos normal/high/min
que filtran recomendaciones · registro de resultados RGS con resumen copiable · academico
con comparador (sin datos institucionales inventados) · graficas reales desde IndexedDB
(vacio -> estado vacio + demo explicito) · logros con condiciones reales · export/import
validado con confirmacion · onboarding saltable · errores con alarma + flip 3D · PWA
(manifest + SW, solo cachea estaticos) · Worker con CORS allowlist + rate limit + limite
de tamano · key de OpenRouter solo como secret del Worker.

## Requiere configuracion manual (pasos en docs/DESPLIEGUE.md)
1. Worker: `wrangler deploy` + `wrangler secret put OPENROUTER_API_KEY` + pegar la URL en Ajustes.
2. Supabase (opcional, fase 2): ejecutar schema.sql, crear proyecto, conectar en `OR.sync.flush()`.
3. Poner tu `logo.svg` real (hay uno placeholder) e iconos si quieres.

## Limitaciones honestas
- Recordatorios de agua/comidas: configurables en datos; el envio real de notificaciones push
  programadas requiere backend Push (no simulado).
- Fusion automatica local<->remoto al iniciar sesion: NO implementada (puente JSON documentado).
