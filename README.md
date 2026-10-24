<div align="center">

<img src="./logo.svg" alt="OpenRoutine Logo" width="130" height="130">

# ⚡ OPEN-ROUTINE // THE DAILY OPERATING SYSTEM
### Sistema Modular Avanzado *Offline-First* para la Gestión Integral de la Vida Diaria, Productividad y Desarrollo Profesional.

[![PWA Ready](https://img.shields.io/badge/PWA-Cross--Platform-34D399?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Modular Vanilla JS](https://img.shields.io/badge/Architecture-Modular%20JS-8B5CF6?style=flat-square&logo=javascript&logoColor=white)](https://developer.mozilla.org/)
[![IndexedDB Local Engine](https://img.shields.io/badge/Storage-IndexedDB-39d0ff?style=flat-square&logo=database&logoColor=white)](https://developer.mozilla.org/)
[![Cloudflare Workers & Supabase](https://img.shields.io/badge/Cloud-Supabase%20%2F%2F%20Workers-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)

*Diseñado para ser el centro neurálgico absoluto del día a día: responsabilidades, trabajo, estudio, entrenamiento físico, nutrición con conteo de calorías y trazabilidad profesional.*

</div>

---

## 📖 Tabla de Contenidos

1. [Visión General & Filosofía del Producto](#-visión-general--filosofía-del-producto)
2. [Arquitectura Modular Escalable](#-arquitectura-modular-escalable)
3. [Estructura del Repositorio](#-estructura-del-repositorio)
4. [Mecánicas del Sistema e Innovación Técnica](#-mecánicas-del-sistema-e-innovación-técnica)
5. [Galería de Interfaces (SaaS Senior Layout)](#-galería-de-interfaces-saas-senior-layout)
6. [Hoja de Ruta Comercial & Visión Indie Hacker](#-hoja-de-ruta-comercial--visión-indie-hacker)
7. [Guía de Puesta en Marcha Local](#-guía-de-puesta-en-marcha-local)
8. [Documentación y Privacidad](#-documentación-y-privacidad)

---

## 🎯 Visión General & Filosofía del Producto

**OpenRoutine** no es simplemente una lista de tareas o una aplicación de gimnasio convencional; está concebida para operar como el **Sistema Operativo (OS) diario del usuario**. 

Ante la saturación de herramientas fragmentadas, OpenRoutine centraliza en una sola plataforma fluida y multidispositivo (móvil y PC):
* **Gestión de Horarios y Responsabilidades:** Control absoluto del tiempo y tareas académicas o laborales.
* **Salud y Rendimiento Físico:** Control de rutinas de ejercicio con variantes de intensidad y registro nutricional de calorías.
* **Privacidad Radical y Rendimiento Extremo:** Operación nativa *offline-first* apoyada por IndexedDB para asegurar velocidad instantánea sin dependencia constante de servidores.

---

## 🏛️ Arquitectura Modular Escalable

Para soportar un sistema de alta complejidad sin comprometer la estabilidad, el proyecto implementa un patrón de **aislamiento de responsabilidades por módulos independientes**. 

Cada función del sistema habita su propio archivo autocontenido dentro de `/js/`, comunicándose a través de un espacio de nombres centralizado (`window.OR`). Esto garantiza que la modificación, depuración o escalabilidad de un módulo (por ejemplo, la gamificación o el motor de recurrencia) **nunca rompa el resto de la aplicación**.

---

## 📂 Estructura del Repositorio

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

## ⚙️ Mecánicas del Sistema e Innovación Técnica

1. **Sistema de Alarma Visual de Errores (`errors.js`):** 
   En lugar de consolas de desarrollador inaccesibles para usuarios promedio, los errores de runtime generan una **alarma flotante roja con animación**. Incluye un botón interactivo que rota en coordenadas 3X/Y/Z para alternar entre una explicación amigable y el volcado del error crudo original.
2. **Sincronización Multidispositivo (`sync.js`):**
   Conexión de perfiles a través de Supabase para mantener sincronizado el horario y las tareas entre el móvil y la PC de forma transparente.
3. **Importador Inteligente de Horarios:**
   Preparado para recibir configuraciones mediante escaneo visual de imágenes o mediante un formato de texto plano amigable (similar a JSON pero simplificado), permitiendo que los usuarios migren sus rutinas en segundos.

---

## 🖼️ Galería del Sistema

| Dashboard Principal & Sugerencias | Misiones & Vista Kanban de Tareas |
| :---: | :---: |
| <img src="Assets/dash.png" alt="Dashboard Principal OpenRoutine" width="100%"> | <img src="Assets/missions.png" alt="Módulo de Misiones OpenRoutine" width="100%"> |

| Gráficas y resultados | Rutinas y tareas |
| :---: | :---: |
| <img src="Assets/rgs.png" alt="Resultados RGS Labs" width="100%"> | <img src="Assets/rutinas.png" alt="Coach de IA y Ajustes" width="100%"> |

---

## 🚀 Hoja de Ruta Comercial & Visión Indie Hacker

OpenRoutine está estructurado bajo una mentalidad de **SaaS independiente (Indie Hacker)** enfocado en un nicho de alto valor: **adolescentes y jóvenes profesionales que buscan el control total de su tiempo**. 

* **Monetización Sutil y Sostenible:** Acceso a sincronización en la nube multidispositivo mediante perfiles de Supabase y funciones avanzadas de IA impulsadas por Cloudflare Workers bajo un modelo freemium o de pago único accesible.
* **Escalabilidad Preparada:** La arquitectura desacoplada permite desplegar el frontend estático de forma inmediata, mientras que el backend y los servicios serverless escalan bajo demanda sin costos fijos elevados.

---

## 📦 Guía de Puesta en Marcha Local

1. Clona el repositorio en tu estación de trabajo:
   ```bash
   git clone https://github.com/tu-usuario/open-routine.git
   ```
2. Abre la carpeta del proyecto en **VS Code**.
3. Inicia el servidor local utilizando extensiones como **Live Server** (evita abrir el archivo `index.html` directamente mediante protocolo `file:///` para asegurar la correcta carga de módulos asíncronos e IndexedDB).

---

## 📄 Documentación y Privacidad

Para auditorías de seguridad y manuales extendidos, consulta los documentos en la carpeta `Docs/`:
*   [Guía Técnica de Despliegue](./Docs/DESPLIEGUE.md)
*   [Política de Privacidad y Manejo Local](./Docs/PRIVACIDAD.md)

---

<div align="center">
  <sub>Arquitectura de alta ingeniería desarrollada por <a href="https://rabbitgamesdev.github.io/RGS-Labs/">RGS Labs</a>.</sub>
</div>
