# Plan de Acción — Hito 3

Diagnóstico y plan de trabajo para completar los requerimientos del Hito 3.

> Fecha del diagnóstico: 17 de noviembre de 2026.
>
> **Actualización 17-11-2026:** Fases 1 y 2 terminadas (Zustand y Playwright). En la fase 3 ya está verificado el ruteo; quedan el despliegue (2.4) y la presentación (fase 4).

---

## Resumen ejecutivo

| # | Requerimiento | Estado | Notas |
|---|---|---|---|
| 1 | Estado global (Zustand o Redux) | ✅ **Implementado** | Zustand: `useAuthStore` y `useArtistsStore` en `frontend/src/stores/` |
| 2 | Ruteo (React Router) | ✅ **Implementado** | Back/forward/F5 y vuelta tras login verificados en `e2etests/` |
| 3 | Pruebas E2E (Playwright) | ✅ **Implementado** | `e2etests/` con 10 pruebas (login + ruta protegida, CRUD de artistas, ruteo); `npm run test:e2e` |
| 4 | Librería de estilos | ✅ **Implementado** | Material UI instalado y en uso (tema, `ThemeProvider`, `CssBaseline`) |
| 5a | TypeScript estricto | ✅ **Implementado** | `"strict": true` en ambos `tsconfig.json`; sin `any` detectados |
| 5b | Errores JSON + códigos HTTP | ✅ **Implementado** | Error handler centralizado con códigos 400/401/403/404/409/500 |
| 5c | Variables sensibles en `.env` | ✅ **Implementado** | `.env` en `.gitignore`, `.env.example` presente |
| — | Despliegue en `fullstack.dcc.uchile.cl` | ❓ **No verificado** | README no tiene URL de despliegue |
| — | Slides PDF + presentación | ❌ **Pendiente** | La parte H del plan anterior sigue sin completar |

---

## 1. Estado Global — ❌ REQUIERE TRABAJO

### Situación actual

El estado de autenticación se maneja con **React Context** (`auth/AuthContext.tsx`), que provee `user`, `loading`, `login`, `logout` y `refresh`. El resto del estado (artistas, obras, talleres, exposiciones) se obtiene con `useState` + `useEffect` local en cada página, llamando a funciones de `services/`.

**No hay ninguna store de Zustand ni de Redux Toolkit.** Las dependencias del `frontend/package.json` no incluyen `zustand` ni `@reduxjs/toolkit`.

### Qué se necesita

> _"Implementar manejo de estado global con Zustand o Redux Toolkit. Incluir al menos dos slices/stores."_

#### Opción recomendada: **Zustand** (más liviano, menos boilerplate)

Se deben crear **al menos dos stores**:

| Store | Responsabilidad | Sustituye |
|---|---|---|
| `useAuthStore` | Usuario autenticado, login, logout, refresh, loading | `AuthContext.tsx` completo |
| `useExpoStore` *(o la entidad principal)* | Datos de la exposición / artistas / obras cacheados | Los `useState` locales en las páginas |

#### Tareas

- [x] **1.1** Instalar Zustand: `npm install zustand --workspace frontend`
- [x] **1.2** Crear `frontend/src/stores/authStore.ts` — migrar la lógica de `AuthContext.tsx` a una store Zustand con estado (`user`, `loading`, `unavailable`) y acciones (`login`, `logout`, `refresh`)
- [x] **1.3** Crear `frontend/src/stores/expoStore.ts` (o `artistsStore.ts` / `artworksStore.ts`) — un segundo store para la entidad principal del proyecto. Por ejemplo: lista de artistas cacheada, o datos de la exposición
- [x] **1.4** Reemplazar `useAuth()` por `useAuthStore()` en todos los componentes que lo usan (`AuthNav`, `ProtectedRoute`, `Login`, `MyVisit`, `Management`, etc.)
- [x] **1.5** Eliminar `AuthContext.tsx` y el `<AuthProvider>` de `main.tsx` una vez migrado
- [x] **1.6** Verificar que login, logout, restauración de sesión y protección de rutas siguen funcionando
- [x] **1.7** Verificar que el segundo store se usa en al menos una vista (p.ej., que la lista de artistas no se re-fetch si ya está en memoria)

---

## 2. Ruteo (React Router) — ✅ Implementado (verificar detalles)

### Situación actual

- **React Router v6** instalado (`react-router-dom ^6.20.0`) y en uso con `<BrowserRouter>`
- Rutas **públicas**: `/`, `/information`, `/artists`, `/artists/:id`, `/catalog`, `/catalog/:id`, `/workshops`, `/visitas`, `/otras-exposiciones`, `/signup`, `/registro`, `/login`
- Rutas **protegidas** (con `<ProtectedRoute>`): `/mi-visita`, `/cuenta`, `/mi-perfil`
- Rutas **protegidas + organizador**: `/gestion`, `/gestion/exposiciones`, `/gestion/envios`
- `ProtectedRoute` redirige a `/login` con `state={{ from: location.pathname }}` para volver después del login
- Ruta catch-all `*` → "Página no encontrada"

### Qué verificar

- [x] **2.1** Que los botones **back** y **forward** del navegador funcionan correctamente entre vistas (no se pierda estado ni se rompa la navegación)
- [x] **2.2** Que **F5 (reload)** en cualquier ruta (incluidas `/catalog/abc123`, `/artists/slug`, `/mi-visita`) recarga correctamente gracias al SPA fallback del servidor o de Vite
- [x] **2.3** Que después del login, el usuario vuelve a la ruta desde la que fue redirigido (el `state.from` en `Login.tsx`)
- [ ] **2.4** En producción/deploy: verificar que el servidor sirve `index.html` para cualquier ruta (SPA fallback), o las rutas directas darán 404

> [!IMPORTANT]
> Punto 2.4 es crítico para el deploy en `fullstack.dcc.uchile.cl`. Si se sirve con Express, se necesita un catch-all que devuelva el `index.html` del build de Vite.

---

## 3. Pruebas E2E (Playwright) — ❌ REQUIERE TRABAJO

### Situación actual

- **No existe** la carpeta `e2etests/`
- **No existe** `playwright.config.ts`
- **Playwright no está instalado** como dependencia
- Existen tests unitarios e integración en `backend/tests/` (13 archivos `.test.ts`), pero son tests de API con supertest, no E2E de navegador

### Qué se necesita

> _"Implementar tests E2E con Playwright. Casos mínimos: (1) Login + acceso protegido, (2) Otro como CRUD sobre una entidad. Carpeta `e2etests/`. Instrucciones en el README."_

#### Tareas

- [x] **3.1** Instalar Playwright: `npm init playwright@latest` en la raíz, configurando la carpeta `e2etests/`
- [x] **3.2** Crear `playwright.config.ts` en la raíz del proyecto, apuntando los tests a `e2etests/`
- [x] **3.3** Crear `e2etests/` con al menos estos archivos:

| Archivo | Caso de prueba |
|---|---|
| `auth.spec.ts` | Login con credenciales válidas → verificar acceso a ruta protegida (`/mi-visita`). Intentar acceder sin login → redirige a `/login` |
| `crud-artists.spec.ts` *(o artworks/workshops)* | Loguearse como organizador → Crear un artista → Verificar que aparece en la lista → Editarlo → Verificar cambios → Eliminarlo → Verificar que desapareció |

- [x] **3.4** Configurar un script de npm para correr los tests: por ejemplo `"test:e2e": "npx playwright test"` en el `package.json` raíz
- [x] **3.5** Agregar instrucciones en el `README.md` (o en un `e2etests/README.md`) para correr los tests:
  ```
  ## Tests E2E
  Requiere que el backend y frontend estén corriendo.
  npm run test:e2e
  ```
- [x] **3.6** Verificar que los tests pasan con la app levantada (backend + frontend + MongoDB)

> [!TIP]
> Los tests E2E necesitan la app corriendo. Considerar usar `webServer` en `playwright.config.ts` para levantar el frontend automáticamente durante los tests.

---

## 4. Diseño y Estilo — ✅ Implementado

### Situación actual

- **Material UI v6** instalado: `@mui/material ^6.4.7`, `@mui/icons-material ^6.4.7`, `@emotion/react`, `@emotion/styled`
- Tema personalizado en `frontend/src/theme.ts` con `createTheme()` — paleta dark, tipografía, overrides de Button, Card, Input, Tabs, etc.
- `<ThemeProvider>` y `<CssBaseline>` aplicados en `main.tsx`
- Se mantienen archivos CSS propios en `frontend/src/styles/` para personalización adicional

### Verificación

- [x] Librería de estilos incorporada (Material UI)
- [ ] **4.1** (Opcional) Revisar si los componentes MUI se usan efectivamente en las vistas o si todo sigue siendo HTML+CSS puro. El tema está configurado pero los componentes podrían no estarse usando

---

## 5. Buenas Prácticas — ✅ Mayormente implementado

### 5a. TypeScript estricto ✅

- `"strict": true` en `backend/tsconfig.json` y `frontend/tsconfig.json`
- **Sin `any` detectados** en ningún archivo de `frontend/src/` ni `backend/src/`
- Los tipos están en carpetas `types/` dedicadas en frontend y backend

### 5b. Errores JSON + códigos HTTP ✅

- Error handler centralizado en `backend/src/utils/middleware.ts` → `errorHandler`
- Maneja: `ValidationError` → 400, `CastError` → 400, JWT errors → 401, duplicados → 409, `SyntaxError` → 400, genérico → 500
- Todos los errores usan formato `{ error: "mensaje" }` con `fields` opcional
- Mensajes en español

### 5c. Variables sensibles en `.env` ✅

- `.env` está en `.gitignore`
- `backend/.env.example` existe con todas las variables documentadas
- Variables sensibles: `JWT_SECRET`, `MONGODB_URI`, `ADMIN_EMAIL_DOMAIN`, `ALLOWED_ORIGINS`

---

## 6. Entregables pendientes

| Entregable | Estado |
|---|---|
| Slides PDF con nombres e integrantes + link al repo | ❌ Pendiente |
| Repositorio público en GitHub con estructura y README | ⚠️ Repo existe, README hay que actualizarlo |
| Presentación de 10 minutos con demo en vivo | ❌ Pendiente |
| Despliegue en `fullstack.dcc.uchile.cl` | ❓ No verificado |

---

## Plan de ejecución — Orden sugerido

### Fase 1: Estado Global (prioridad alta, ~4-6 horas)

1. Instalar Zustand
2. Crear `authStore.ts` y migrar `AuthContext`
3. Crear segundo store (artistas o exposición)
4. Actualizar todos los componentes
5. Probar flujo completo

### Fase 2: Tests E2E (prioridad alta, ~3-4 horas)

1. Instalar Playwright y configurar
2. Crear carpeta `e2etests/`
3. Escribir test de autenticación
4. Escribir test CRUD
5. Documentar en README

### Fase 3: Verificación Router + Deploy (prioridad media, ~2-3 horas)

1. Probar back/forward/F5 en todas las rutas
2. Configurar SPA fallback en el servidor de producción
3. Verificar deploy en `fullstack.dcc.uchile.cl`
4. Agregar URL de deploy al README

### Fase 4: Presentación (prioridad según fecha)

1. Preparar slides PDF
2. Repartir demo en vivo por integrante
3. Ensayar

---

## Dependencias entre tareas

```
Fase 1 (Zustand) ──────────────────────────┐
                                            ├──► Fase 3 (Verificar Router + Deploy)
Fase 2 (Playwright E2E) ──────────────────┘
                                            
Fase 4 (Presentación) → se puede hacer en paralelo, pero idealmente después de Fases 1-3
```

> [!WARNING]
> Las **dos carencias críticas** son el Estado Global (Zustand/Redux) y las Pruebas E2E (Playwright). Sin estas dos cosas, el Hito 3 está incompleto respecto a los requerimientos explícitos. El ruteo y el diseño ya están cubiertos.
