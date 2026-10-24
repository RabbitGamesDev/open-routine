<div align="center">

<img src="./logo.svg" alt="OpenRoutine Logo" width="140" height="140">

# ⚡ OPEN-ROUTINE // CORE SYSTEM
### Sistema Modular Avanzado *Offline-First* para Gestión de Productividad, Hábitos y Trazabilidad Profesional.

[![PWA Offline-First](https://img.shields.io/badge/PWA-Production%20Ready-34D399?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Vanilla JS Modular](https://img.shields.io/badge/Architecture-Modular%20ES%20Modules-8B5CF6?style=flat-square&logo=javascript&logoColor=white)](https://developer.mozilla.org/)
[![IndexedDB Engine](https://img.shields.io/badge/Storage-IndexedDB%20(Secured)-39d0ff?style=flat-square&logo=database&logoColor=white)](https://developer.mozilla.org/)
[![Cloudflare Workers](https://img.shields.io/badge/AI-Cloudflare%20Workers-F472B6?style=flat-square&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Supabase Database](https://img.shields.io/badge/Sync-Supabase%20PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)

*Diseñado bajo un paradigma de rendimiento extremo, privacidad absoluta en local y trazabilidad de entregables profesionales (RGS Labs).*

</div>

---

## 📖 Tabla de Contenidos

1. [Filosofía y Visión del Sistema](#-filosofía-y-visión-del-sistema)
2. [Arquitectura y Estructura de Archivos](#-arquitectura-y-estructura-de-archivos)
3. [Desglose Técnico de Módulos (`/js`)](#-desglose-técnico-de-módulos-js)
4. [Características Clave y Mecánicas](#-características-clave-y-mecánicas)
5. [Galería del Sistema](#-galería-del-sistema)
6. [Guía de Instalación y Entorno Local](#-guía-de-instalación-y-entorno-local)
7. [Despliegue de Servicios (Cloudflare & Supabase)](#-despliegue-de-servicios-cloudflare--supabase)
8. [Documentación y Privacidad](#-documentación-y-privacidad)

---

## 🎯 Filosofía y Visión del Sistema

**OpenRoutine** nace como una alternativa robusta frente a los gestores de tareas tradicionales inflados por frameworks pesados y dependencias de terceros. Su diseño prioriza:
*   **Velocidad Instantánea:** Cero tiempos de carga inicial mediante una estructura estática y almacenamiento local nativo.
*   **Privacidad Radical (*Offline-First*):** El núcleo de datos reside en el navegador (`IndexedDB`). Ningún hábito personal o rutina privada es expuesto a servidores de terceros.
*   **Inteligencia Artificial Desacoplada:** Las consultas al Coach de IA se gestionan mediante una pasarela segura en **Cloudflare Workers**, aislando por completo las llaves secretas de OpenRouter del entorno del cliente.

---

## 🏛️ Arquitectura y Estructura de Archivos

El proyecto mantiene una separación estricta de responsabilidades (*Separation of Concerns*), organizando los componentes visuales, motores lógicos, capas de datos y servicios en una jerarquía limpia:

```text
open-routine/
├── css/
│   ├── animations.css
│   ├── base.css
│   ├── components.css         # Estilos modulares para componentes, modales y tarjetas
│   └── tokens.css             # Variables CSS globales, paleta de colores y sistema tipográfico
├── Docs/
│   ├── DESPLIEGUE.md          # Manual avanzado de despliegue en la nube
│   └── PRIVACIDAD.md          # Especificaciones técnicas de manejo de datos y cifrado local
├── js/
│   ├── app.js                 # Inicializador global y punto de montaje del ciclo de vida
│   ├── backup.js              # Sistema de exportación e importación segura de respaldos JSON
│   ├── coach.js               # Puente de comunicación con el Worker de IA y parseo de respuestas
│   ├── db.js                  # Wrapper de IndexedDB con promesas y serialización anti-DataClone
│   ├── engine.js              # Motor analítico, cálculo de estados del día y recomendaciones
│   ├── errors.js              # Manejador global de excepciones y notificaciones de error en UI
│   ├── gamification.js        # Motor de experiencia (XP), niveles y logros desbloqueables
│   ├── onboarding.js          # Secuencia de bienvenida y configuración de perfil inicial
│   ├── recurrence.js          # Motor de recurrencia (diaria, días específicos, intervalos de N días)
│   ├── router.js              # Enrutador dinámico basado en hashes URL (#/inicio, #/rutinas...)
│   ├── seed.js                # Semilla de datos iniciales y rutinas de prueba por defecto
│   ├── store.js               # Capa intermedia de estado global y abstracción del DOM
│   ├── sync.js                # Lógica auxiliar de sincronización y control de red
│   ├── ui.js                  # Utilidades de interfaz (renderizado de iconos, toasts, diálogos)
│   ├── util.js                # Funciones puras de apoyo (manipulación de fechas, saneamiento)
│   └── views.js               # Renderizadores de las vistas principales de la aplicación
├── Supabase/
│   └── schema.sql             # Esquema relacional SQL para sincronización opcional multicliente
├── Worker/
│   └── index.js               # Cloudflare Worker (Proxy seguro de peticiones para OpenRouter)
├── .env.example               # Plantilla de variables de entorno requeridas
├── .gitignore                 # Exclusiones de control de versiones Git
├── index.html                 # Documento HTML principal de la PWA
├── logo.svg                   # Isotipo oficial de la identidad visual
├── manifest.webmanifest       # Manifiesto de la Progressive Web App
├── README.md                  # Documentación oficial del repositorio
├── sw.js                      # Service Worker para caché offline y soporte PWA nativo
└── wrangler.toml              # Configuración de despliegue y bindings de Cloudflare Workers
```

---

## 🧩 Desglose Técnico de Módulos (`/js`)

Cada módulo en la carpeta `js/` opera como un subsistema autocontenido expuesto a través del espacio de nombres global `window.OR`:

*   **`app.js`**: Orquesta el arranque de la aplicación, registra el Service Worker y enlaza los eventos globales del ciclo de vida del navegador.
*   **`db.js`**: Implementa una capa de abstracción sobre **IndexedDB**. Incluye mecanismos de clonación profunda (`JSON.parse(JSON.stringify)`) para prevenir errores de serialización (`DataCloneError`) al interactuar con el almacenamiento asíncrono.
*   **`recurrence.js`**: Maneja la lógica temporal de las rutinas. A diferencia de las aplicaciones que generan miles de registros futuros innecesarios, este motor calcula las ocurrencias **bajo demanda** con reglas flexibles (diarias, días concretos o saltos de $N$ días).
*   **`gamification.js`**: Sistema de recompensas basado en acciones reales. Administra el otorgamiento de XP y desbloqueo de logros asegurando que las necesidades humanas básicas (descanso, sueño, alimentación) **jamás** dependan de puntos virtuales.
*   **`coach.js`**: Gestiona el flujo de peticiones hacia el Cloudflare Worker, enviando contexto de productividad enmascarado de forma segura.
*   **`store.js` y `router.js`**: Controlan la reactividad interna y la navegación fluida de la aplicación sin recargas de página (*Single Page Application*).

---

## 🚀 Características Clave y Mecánicas

1.  **Seguridad de Datos Local (*IndexedDB*):** El almacenamiento supera con creces las limitaciones de `localStorage`, permitiendo manejar miles de registros de tareas, resultados y logs sin degradar el rendimiento.
2.  **Rachas Flexibles:** Las rachas del sistema no se destruyen por un día de descanso o imprevistos; se pausan inteligentemente para evitar la fatiga por gamificación punitiva.
3.  **Trazabilidad Profesional (RGS Labs):** Enfoque centrado en entregables verificables, enlaces a repositorios y métricas de impacto real en lugar de simples listas de pendientes estériles.

---

## 🖼️ Galería del Sistema

| Dashboard Principal & Sugerencias | Misiones & Vista Kanban de Tareas |
| :---: | :---: |
| <img src="Assets/dash.png" alt="Dashboard Principal OpenRoutine" width="100%"> | <img src="Assets/missions.png" alt="Módulo de Misiones OpenRoutine" width="100%"> |

| Módulo RGS Labs & Resultados | Configuración & Coach de Inteligencia Artificial |
| :---: | :---: |
| <img src="Assets/rgs.png" alt="Resultados RGS Labs" width="100%"> | <img src="Assets/coach.png" alt="Coach de IA y Ajustes" width="100%"> |

---
## 📦 Guía de Instalación y Entorno Local

Para poner en marcha el entorno de desarrollo en tu máquina local:

1. Clona el repositorio oficial:
   ```bash
   git clone https://github.com/tu-usuario/open-routine.git
   cd open-routine
   ```
2. Abre la carpeta del proyecto en **VS Code**.
3. Inicia un servidor de desarrollo local (se recomienda encarecidamente utilizar la extensión **Live Server** para asegurar la correcta ejecución del protocolo HTTP/HTTPS y el registro de Service Workers). Evita abrir el archivo `index.html` mediante doble clic directo (`file:///`).

---

## ☁️ Despliegue de Servicios (Cloudflare & Supabase)

### 1. Despliegue del Cloudflare Worker (Coach AI)
```bash
npm install -g wrangler
wrangler login
wrangler secret put OPENROUTER_API_KEY
cd Worker
wrangler deploy
```
Copia la URL resultante e insértala en el panel de configuración de tu aplicación cliente.

### 2. Configuración de Base de Datos en Supabase
1. Crea un nuevo proyecto gratuito en [Supabase](https://supabase.com/).
2. Dirígete al **SQL Editor**.
3. Copia el contenido íntegro del archivo **`Supabase/schema.sql`**, pégalo en la consola de Supabase y ejecuta la sentencia para inicializar las tablas relacionales.

---

## 📄 Documentación y Privacidad

Para auditorías de seguridad y manuales extendidos, consulta los documentos en la carpeta `Docs/`:
*   [Guía Técnica de Despliegue](./Docs/DESPLIEGUE.md)
*   [Política de Privacidad y Manejo Local](./Docs/PRIVACIDAD.md)

---

<div align="center">
  <sub>Arquitectura de alta ingeniería desarrollada por <a href="https://rabbitgamesdev.github.io/RGS-Labs/">RGS Labs</a>.</sub>
</div>
