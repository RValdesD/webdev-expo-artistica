# Plan — Hito 2: backend real, autenticación y dos vistas nuevas

Base: la app de Rodrigo (`art-expo`), la que se presentó en el Hito 1. Estructura y esquema de autenticación: los de los ejemplos del curso (clases 6 a 9).

**Presentación:** semana del 20 de octubre, 10 minutos, demo en vivo con frontend + backend Express + MongoDB.

---

## 1. Lo que pide el enunciado

| # | Requisito | Parte del plan |
|---|---|---|
| 1 | Backend en TypeScript con Express y Mongoose; json-server deja de usarse | 0 |
| 2 | Cada entidad con endpoints REST: listar, obtener por id, crear, actualizar, eliminar | C ✅ (falta protegerlos con la Parte A) |
| 3 | Errores consistentes: siempre JSON y el código correcto (400, 401, 404…) | 0 (base) + C |
| 4 | Registro, login, logout y endpoint de sesión (`/me`) | A |
| 5 | JWT en cookie `httpOnly` + información complementaria en `localStorage` (XSS y CSRF) | A + B |
| 6 | Rutas protegidas en el backend (rechaza sin sesión) y en el frontend (redirige a login) | A + B |
| 7 | Dos vistas nuevas completas contra el backend real, respetando rutas protegidas | D + E |
| 8 | Secretos en `.env` no versionado + `.env.example` en el repo | 0 |
| 9 | Repo público con `frontend/` y `backend/`, README con variables, cómo correrlo y URL desplegada | 0 (base) + G |
| 10 | Siguen vigentes: DOM solo vía React, sin `any`, interacción con estado | todas |

---

## 2. Punto de partida

**Ya existe** (app de Rodrigo):
- Backend Express + Mongoose + TypeScript.
- Modelos: `Artist`, `Artwork`, `Workshop`, `Expo`.
- Endpoints: `GET /api/expo`, `GET /api/artists`, `GET /api/artists/:id`, `GET /api/artworks`, `GET /api/workshops`, `POST /api/workshops/:id/registrations`.
- Frontend React + React Router con 5 vistas: Información, Artistas, Detalle de artista, Catálogo, Workshops.

**Falta:**
- Crear, actualizar y eliminar en todas las entidades, y obtener por id en obras y talleres.
- Autenticación completa (no hay usuarios).
- Rutas protegidas.
- Las dos vistas nuevas.
- README completo y despliegue.

---

## 3. Las partes

### Parte 0 — Base del proyecto  (hecha antes de repartir)

Para que todos partan del mismo lugar.

- [x] 0.1 Carpeta nueva con `frontend/` y `backend/` en la raíz y el `.gitignore` de los ejemplos del curso.
- [x] 0.2 Backend reorganizado como los ejemplos del curso: `src/index.ts`, `src/app.ts`, `controllers/` (un router por entidad), `models/`, `utils/config.ts`, `utils/logger.ts`, `utils/middleware.ts`, `tests/`, `requests.rest`.
- [x] 0.3 Errores base consistentes en `middleware.ts`: JSON siempre, 404 para rutas desconocidas, 400 para validación, id mal formado, JSON mal escrito y duplicados.
- [x] 0.4 `.env.example` con todas las variables (incluida `JWT_SECRET`) y un `seed` que carga todo con un solo comando.
- [x] 0.5 Mejoras de CSS del Hito 1: texto azul legible sobre fondos oscuros, contorno de foco visible en los inputs, botón deshabilitado que no parece roto y filtros del catálogo alineados.
- [x] 0.6 README base.

### Parte A — Autenticación en el backend

Sigue el esquema de la clase 8 (`c08 - authentication/prompt-flujo-4.0-auth.md`).

- [ ] A.1 Modelo `User` en `models/users.ts`: `username` (único), `name`, `passwordHash`. El `toJSON` borra `passwordHash`.
- [ ] A.2 Instalar `bcrypt`, `jsonwebtoken`, `cookie-parser` y sus `@types`.
- [ ] A.3 Registro: `POST /api/users` con `bcrypt.hash`.
- [ ] A.4 Login: `POST /api/login` firma un JWT con `{ username, id, csrf: crypto.randomUUID() }` (1 hora), lo manda en cookie `token` (`httpOnly`, `sameSite: "strict"`, `secure` en producción) y el CSRF en el header `X-CSRF-Token`.
- [ ] A.5 Middleware `withUser` en `utils/middleware.ts`: lee la cookie, verifica el JWT y compara su `csrf` con el header `x-csrf-token`. Deja `request.userId`.
- [ ] A.6 `src/types/express.d.ts` con `userId?: string` en `Request`.
- [ ] A.7 `GET /api/login/me` (con `withUser`) y `POST /api/login/logout` (`clearCookie`).
- [ ] A.8 En `errorHandler`: `JsonWebTokenError` y `TokenExpiredError` → 401.
- [ ] A.9 Tests: login válido 200, header CSRF presente, login inválido 401, ruta protegida sin cookie 401, con cookie pero sin CSRF 401.

### Parte B — Autenticación en el frontend

- [ ] B.1 `src/utils/axiosSecure.ts`: axios con `withCredentials: true` que agrega `X-CSRF-Token` desde `localStorage`.
- [ ] B.2 `src/services/login.ts`: `login` (guarda el CSRF en `localStorage`), `restoreLogin` (`/api/login/me`), `logout` (borra el CSRF). Más `register` en `services/users.ts`.
- [ ] B.3 Estado del usuario en la app: se restaura al cargar con `restoreLogin`.
- [ ] B.4 Vistas `/login` y `/registro`, con errores visibles.
- [ ] B.5 Componente `ProtectedRoute`: sin sesión hace `<Navigate to="/login" />`.
- [ ] B.6 Menú: reemplazar el enlace falso "Crear Cuenta / Iniciar Sesión" por login real, nombre del usuario y logout.

### Parte C — CRUD completo y errores

Para `artists`, `artworks` y `workshops`: `GET /` · `GET /:id` · `POST /` · `PUT /:id` · `DELETE /:id`. Expo es un solo documento: `GET` + `PUT`.

- [x] C.1 Routers completos en `controllers/`. **Falta solo** agregar `withUser` a crear, actualizar y eliminar cuando esté A.5; cada controlador tiene un comentario donde va.
- [x] C.2 Toda actualización con `runValidators: true` (la lección del Lab 6). Solo se aceptan campos permitidos: nadie puede escribir `isSample` ni las inscripciones.
- [x] C.3 404 cuando el recurso no existe; 201 al crear; 204 al eliminar; 409 si el id ya existe; 400 si un campo no se puede convertir (indica cuál).
- [x] C.4 Decidido: un artista con obras o talleres **no se elimina** (409). Además, una obra o taller no puede apuntar a un artista inexistente (400), y un taller no puede quedar con menos cupos que inscritos (400).
- [x] C.5 Tests de integración en `backend/tests/controllers/`: 42 tests, más los 3 del modelo (`npm test` → 45).

### Parte D — Vista nueva 1: "Mi visita" (perfil del visitante)

Es la vista que se mostró como mockup en el Hito 1 (slide 5) y que se anunció para el Hito 2.

- [ ] D.1 Backend: las inscripciones guardan el `userId` de quien se inscribe (con `withUser`), en vez de nombre y correo sueltos.
- [ ] D.2 Backend: `GET /api/registrations/me` (mis inscripciones) y `DELETE /api/workshops/:id/registrations` (cancelar la mía).
- [ ] D.3 Frontend: ruta protegida `/mi-visita` con próximo taller, lista de inscripciones y botón para cancelar.
- [ ] D.4 En Workshops, inscribirse pide sesión: sin sesión, lleva a login.

### Parte E — Vista nueva 2: "Panel de gestión"

Para crear, editar y eliminar obras y talleres desde la app.

- [ ] E.1 Ruta protegida `/gestion` con pestañas Obras y Talleres.
- [ ] E.2 Formularios controlados con `useState` para crear y editar, con los errores 400 del backend visibles.
- [ ] E.3 Eliminar con confirmación.
- [ ] E.4 Usa los endpoints de la parte C con `axiosSecure`.

**Decisión pendiente del grupo:** ¿cualquier usuario con sesión puede gestionar, o solo un rol "organizador"? Con rol, el modelo `User` suma `role: "visitante" | "organizador"`, y el backend responde 403 cuando no corresponde. Se recomienda el rol, porque calza con los tres perfiles del Hito 0, pero agrega trabajo a las partes A y C.

### Parte F — Tests

- [ ] F.1 Tests de autenticación (ver A.9).
- [ ] F.2 Tests de CRUD por entidad (ver C.5).
- [ ] F.3 Opcional: tests de componentes con Vitest, como en la clase 9.

### Parte G — Entrega

- [ ] G.1 README completo: variables de entorno, cómo correrlo y URL desplegada.
- [ ] G.2 Despliegue en el servidor del curso con `npm run build:ui` (el frontend compilado lo sirve Express desde `dist/`).
  **Ojo, comprobado:** servido desde el backend, `/` carga pero recargar o abrir directo `/artists` responde 404, porque esas rutas solo existen en React Router. Falta en `app.ts`, antes de `unknownEndpoint`, un `GET` para todo lo que no empiece con `/api` que responda `dist/index.html`. Con `npm run dev` del frontend no pasa: solo afecta a la versión desplegada.
- [ ] G.3 Slides: tema, funcionalidades y cambios de prioridad, flujo de autenticación, vistas nuevas, **slide de endpoints** (ruta, método y uso), integrantes, reflexión.
- [ ] G.4 Ensayo con cronómetro: 10 minutos exactos.

---

## 4. Orden y dependencias

```
Parte 0 (hecha)
   │
   ├──► A: auth backend ──► B: auth frontend ──┐
   │        │                                  ├──► D: Mi visita
   │        └──► C: CRUD (rutas protegidas) ───┴──► E: Panel de gestión
   │
   └──► G.1 README (se puede ir llenando desde ya)

F: tests van junto con A y C, no al final.
```

**A y C se pueden empezar en paralelo**: C hace primero los GET y los endpoints sin protección, y agrega `withUser` cuando A esté lista.

---

## 5. Reparto sugerido (5 personas)

| Persona | Partes | Por qué juntas |
|---|---|---|
| 1 | A (auth backend) + F.1 | Lo más delicado: un error no se ve en la interfaz |
| 2 | B (auth frontend) | Depende directo de A; conviene coordinar el formato de las respuestas |
| 3 | C (CRUD) + F.2 | Mucho backend repetitivo; bien para avanzar en paralelo con A |
| 4 | D (Mi visita) | Toca backend (inscripciones) y frontend |
| 5 | E (Panel de gestión) + G.1 | Consume C; README en paralelo |

G.2 a G.4 entre todos la última semana.

---

## 6. Convenciones

- **Node 22 o superior.** El backend corre TypeScript directo con `node`, como en los ejemplos del curso. `nvm use 22`.
- **Una rama por parte:** `parte-a-auth-backend`, `parte-b-auth-frontend`, etc. Se mergea a `main` cuando sus tests pasan.
- **Nunca se sube el `.env`.** Si agregas una variable, agrégala también a `.env.example`.
- **`runValidators: true`** en toda actualización.
- **Sin `any`.** Si queda uno, se justifica en la presentación.

## 7. Endpoints al final del hito (para la slide)

| Método | Ruta | Uso | Sesión |
|---|---|---|---|
| POST | `/api/users` | Registro | — |
| POST | `/api/login` | Login: cookie con JWT + header CSRF | — |
| GET | `/api/login/me` | Restaurar sesión | ✔ |
| POST | `/api/login/logout` | Logout | — |
| GET | `/api/expo` | Información de la expo | — |
| PUT | `/api/expo` | Editar la información | ✔ |
| GET | `/api/artists` · `/api/artworks` · `/api/workshops` | Listar | — |
| GET | `/api/artists/:id` · `/api/artworks/:id` · `/api/workshops/:id` | Obtener uno | — |
| POST | `/api/artists` · `/api/artworks` · `/api/workshops` | Crear | ✔ |
| PUT | `/api/artists/:id` · `/api/artworks/:id` · `/api/workshops/:id` | Actualizar | ✔ |
| DELETE | `/api/artists/:id` · `/api/artworks/:id` · `/api/workshops/:id` | Eliminar | ✔ |
| POST | `/api/workshops/:id/registrations` | Inscribirse | ✔ |
| DELETE | `/api/workshops/:id/registrations` | Cancelar mi inscripción | ✔ |
| GET | `/api/registrations/me` | Mis inscripciones | ✔ |
