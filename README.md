# NASA Explorer — Prueba técnica

El proyecto es una aplicación frontend (React + Vite + TypeScript) que consume APIs públicas de la NASA (APOD, Mars Rover, NEO, EPIC). UI construida con PrimeReact y utilidades de Tailwind CSS. Pensado para personas que quieran explorar datos de la NASA con una experiencia rápida y accesible.

> Estado del repo: contiene implementaciones para Mars, NEO, EPIC y páginas de favoritos; APOD está presente como componente simple (placeholder). Tailwind, PostCSS y configuración de rutas ya están integradas.

---

## Tabla de contenidos

- [Demo](#demo)
- [Stack técnico](#stack-técnico)
- [Características](#características-funcionales)
- [Arquitectura y estructura de carpetas](#arquitectura-y-estructura-de-carpetas)
- [Variables de entorno](#variables-de-entorno)
- [Comandos](#comandos)
- [Estilos y UI](#estilos-y-ui)
- [Accesibilidad y optimización de imágenes](#accesibilidad-y-optimizaci%C3%B3n-de-im%C3%A1genes)
- [Persistencia de favoritos (localStorage)](#persistencia-de-favoritos-localstorage)
- [Enrutamiento y despliegue (Vercel) — SPA rewrites](#enrutamiento-y-despliegue-vercel-spa-rewrites)
- [Calidad de código y DX](#calidad-de-c%C3%B3digo-y-developer-experience-dx)
- [Tests](#tests)
- [Roadmap / TODO](#roadmap--todo)
- [Licencia](#licencia)

---

## Demo

- Deploy público: [Enlace directo a la aplicación desplegada en Vercel](https://prueba-tecnica-two-gamma.vercel.app/)

---

## Stack técnico

- Vite
- React 19 + TypeScript (strict)
- `react-router-dom` v7 (`createBrowserRouter`, `RouterProvider`)
- `@tanstack/react-query` (React Query)
- PrimeReact + PrimeIcons (UI components: DataTable, Dialog, SelectButton, Paginator, etc.)
- Tailwind CSS v4 + PostCSS + Autoprefixer
- `vite-tsconfig-paths` para resolver alias `@/*` a `src/`

Dependencias principales se encuentran en `package.json`. Si añades librerías nuevas, mantén coherencia con estas versiones.

---

## Características (funcionales)

Las páginas implementadas en el repo (resumen):

- APOD (Astronomy Picture Of the Day)
    - Componente presente en `src/pages/apod/ApodPage.tsx` (actualmente placeholder).

- Mars (Mars Rover Photos)
    - Componente presente en `src/pages/mars/MarsPage.tsx`

- NEO (Near-Earth Objects)
    - Componente presente en `src/pages/neo/NeoPage.tsx`

- EPIC (Earth Polychromatic Imaging Camera)
    - Componente presente en `src/pages/epic/EpicPage.tsx`

Comportamiento general:

- Las imágenes usan `loading="lazy"`, `decoding="async"` y `sizes` para optimización.
- La URL se sincroniza con parámetros relevantes (search params) para reproducibilidad.

---

## Arquitectura y estructura de carpetas

Estructura clave (resumen):

```
└── 📁prueba-tecnica
    └── 📁public
        ├── 404.svg
        ├── 503.svg
        ├── nasa.svg
    └── 📁src
        └── 📁app
            └── 📁providers
                ├── QueryProvider.tsx
                ├── RouterProvider.tsx
            └── 📁routes
                ├── router.tsx
            └── 📁styles
                ├── index.css
            ├── AppLayout.tsx
            ├── main.tsx
        └── 📁features
            └── 📁apod
                ├── hooks.ts
            └── 📁epic
                ├── hooks.ts
            └── 📁mars
                ├── hooks.ts
            └── 📁neo
                ├── hooks.ts
        └── 📁pages
            └── 📁apod
                ├── ApodPage.tsx
            └── 📁epic
                ├── EpicPage.tsx
            └── 📁favorites
                ├── FavoritesPage.tsx
            └── 📁mars
                ├── MarsPage.tsx
            └── 📁neo
                ├── NeoPage.tsx
            └── 📁not-found
                ├── not-found.tsx
        └── 📁shared
            └── 📁api
                └── 📁types
                    ├── apod.ts
                    ├── epic.ts
                    ├── mars.ts
                    ├── neo.ts
                ├── http.ts
                ├── nasa.ts
            └── 📁config
                ├── env.ts
        ├── vite-env.d.ts
    ├── .env
    ├── .gitignore
    ├── .prettierrc
    ├── eslint.config.js
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.js
    ├── README.md
    ├── tailwind.config.js
    ├── tsconfig.app.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vercel.json
    └── vite.config.ts
```

Flujo de datos:

- `shared/api/http.ts` expone cliente HTTP y manejo de `HttpError`.
- `shared/api/nasa.ts` contiene wrappers para endpoints (APOD, Mars, NEO, EPIC).
- Las páginas usan `useQuery` (React Query) para consumir y cachear datos, y renderizan UI con PrimeReact.

---

## Variables de entorno

- `VITE_NASA_API_KEY` — clave pública de la NASA. Se debe Añádir en un archivo `.env` en la raíz:

```
VITE_NASA_API_KEY=tu_api_key_aqui
```

- Nota: Vite expone `import.meta.env.VITE_*` al cliente. Valida la existencia de la clave al inicializar (`env.ts` opcional).

Recomendación: añadir `.env.example` con la clave indicada como `REPLACE_ME`.

---

## Comandos

Instalar dependencias:

```powershell
npm install
```

Desarrollo (dev server):

```powershell
npm run dev
# abre http://localhost:5173
```

Build producción:

```powershell
npm run build
```

Preview del build:

```powershell
npm run preview
```

Lint:

```powershell
npm run lint
```

Notas:

- Si `vite` advierte por versión de Node, usa Node >= 20.19.0 o Node 22+.

---

## Estilos y UI

- Tailwind CSS (directivas en `src/app/styles/index.css`): `@tailwind base; @tailwind components; @tailwind utilities;`.
- Se añadió `postcss.config.cjs` y `tailwind.config.cjs` (content apuntando a `./index.html` y `./src/**/*.{js,ts,jsx,tsx}`).
- PrimeReact: si no están importados globalmente los estilos, agrégalos (opcional) a `src/app/styles/index.css`:

```css
@import 'primereact/resources/themes/saga-blue/theme.css'; /* (opcional: cambiar tema) */
@import 'primereact/resources/primereact.min.css';
@import 'primeicons/primeicons.css';
```

Dialog styling:

- Los Dialogs usan `modal`, `blockScroll` y `pt.mask` para máscara opaca. Ver `src/pages/epic/EpicPage.tsx` para ejemplo.

---

## Accesibilidad y optimización de imágenes

- Atributos `alt`, `aria-*` y roles presentes en componentes críticos.
- Diálogos accesibles (control de foco y escape).
- Imágenes optimizadas con `loading="lazy"`, `decoding="async"`, `sizes`.

---

## Persistencia de favoritos (localStorage)

- Claves usadas:
    - `mars:favorites`
    - `apod:favorites` (opcional / futuro)
    - `epic:favorites` (opcional / futuro)

- Formato (ejemplo Mars):

```json
[
	{
		"id": 1,
		"img_src": "url",
		"earth_date": "2021-01-01",
		"rover": { "name": "Curiosity" },
		"camera": { "name": "NAVCAM", "full_name": "Nav Cam" }
	}
]
```

Funciones utilitarias en `FavoritesPage` y `MarsPage` hacen read/write seguro (try/catch + fallback a `[]`).

---

## Enrutamiento y despliegue (Vercel) — SPA rewrites

Para desplegar en Vercel y evitar 404 en rutas SPA, añade `vercel.json` con:

```json
{
	"routes": [{ "handle": "filesystem" }, { "src": "/.*", "dest": "/index.html" }]
}
```

Esto garantiza que React Router maneje las rutas en cliente.

---

## Calidad de código y Developer Experience (DX)

- TypeScript en `strict` (ver `tsconfig.app.json`).
- ESLint y Prettier están presentes en `devDependencies`.
- `vite-tsconfig-paths` + alias `@` para imports absolutos.

---

## Roadmap / TODO

- Implementar APOD completo (rango de fechas, diálogo con metadata y favoritos).
- Añadir workflow CI (lint, build, tests) en GitHub Actions.
- Añadir `vercel.json` y desplegar (pendiente).
- Mejorar mocks y cobertura de tests para endpoints NASA.

---
