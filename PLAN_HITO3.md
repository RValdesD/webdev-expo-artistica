# Plan — Arreglos del Hito 2 antes del Hito 3

Lista acordada por el grupo, ordenada en partes que se pueden repartir. Cada parte dice qué archivos toca y cuándo está lista.

---

## 1. De la lista del grupo a las partes

| # | Objetivo del grupo | Parte |
|---|---|---|
| 1 | Rol admin según correo `@admin` | A |
| 2 | Login con CSRF | A |
| 3 | Mejorar la descripción de los errores | B |
| 4 | MaterialUI / especificar el tipo de UI | C (se decide primero) |
| 5 | Quitar el gris y cambiar el azul en el CSS | C |
| 6 | Arreglar la resolución (responsive) | C |
| 7 | "Otras exposiciones" como vista propia + gestión por el admin | D |
| 8 | Íconos con enlace a redes en los perfiles | E |
| 9 | Mejorar la inscripción a talleres | F |
| 10 | Slideshow para las obras | G |
| 11 | Slides hechas a mano 2 días antes del deadline | H |

---

## 2. Estado actual (revisado en `hito2`, commit `dcaa304`)

- **El build del backend falla**: `tsc` da 19 errores por archivos viejos que ya no se usan (`controllers/{artists,artworks,workshops,expo}.ts`, `models/{artists,artworks,workshops}.ts`, `utils/body.ts`, `auth/*`, `routes/*`, `server.ts`, `config.ts`, `models/Client*`, `middleware/errorHandler.ts`, `tests/controllers/`, `tests/client-auth.test.mjs`).
- **Mayúsculas en `Expo`**: 6 imports usan `models/Expo.js`, pero el archivo es `models/expo.ts`. En Mac funciona; **en Linux (deploy) se cae**.
- **Roles**: existen `visitante` y `organizador`. El organizador se asigna a mano con `npm run user:role`. El correo ya existe en `User` y se pide al registrarse.
- **CSRF**: las rutas con sesión ya validan el token (JWT en cookie `httpOnly` + header `X-CSRF-Token`). **`POST /api/login` y `POST /api/users` no tienen protección CSRF.**
- **Errores**: los de validación salen en inglés y con formato de Mongoose (`Artwork validation failed: title: Path 'title' is required.`), y el 409 es genérico.
- **"Otras exposiciones"**: está escrita a mano en `pages/Information.tsx`; no viene del backend.
- **Perfiles**: el modelo `Artist` no tiene campos de redes.
- **UI**: no hay librería de componentes; todo es CSS propio (`styles.css` + `styles/*.css`).
- Archivos sueltos: `query`, `frontend/public/images/FISH.png~`, `LAST_FIXES.md`. El README no tiene la URL desplegada.

---

## 3. Las partes

### Parte 0 — Deuda técnica ✅

Sin esto el deploy falla y cualquier cambio posterior arrastra el problema.

- [x] 0.1 Borrar el código muerto listado arriba (verificar antes con `grep` que nada lo importa).
- [x] 0.2 Mayúsculas: en vez de renombrar el archivo, todos los imports usan `models/expo.js`, igual que el archivo (funciona en Linux). El `tsconfig` vuelve a compilar todo `src`.
- [x] 0.3 Borrar `query`, `FISH.png~` y `LAST_FIXES.md`.
- [x] 0.4 `npm run build` sin errores en backend y frontend; `npm test` y `npm run test:integration` en verde.

**Lista cuando:** el build pasa y los tests pasan.

### Parte A — Roles y seguridad ✅ (rama `hito2-arreglo`)

**Decidido:** el rol sigue llamándose `organizador`; el dominio es `@admin.expo.cl` (`ADMIN_EMAIL_DOMAIN` en `.env`); las cuentas de organizador se crean **por script**.

**A1. Rol organizador por correo `@admin.expo.cl`**

- [x] A1.1 `ADMIN_EMAIL_DOMAIN` en `utils/config.ts` y `.env.example`.
- [x] A1.2 El registro público rechaza los correos del dominio admin (403).
- [x] A1.3 `npm run user:create-admin --workspace backend -- <usuario> <correo@admin.expo.cl> "<Nombre>"` crea el organizador (pide la contraseña sin mostrarla).
- [x] A1.4 `user:role ... organizador` solo acepta cuentas con correo del dominio admin.
- [x] A1.5 Tests: registro con correo admin → 403 sin crear la cuenta.

**A2. CSRF en el login**

- [x] A2.1 `requireSameOrigin` en `POST /api/login` y `POST /api/users`: un `Origin`/`Referer` de otro sitio → 403. En desarrollo se permite Vite (`localhost:5173`); en producción, agregar la URL del frontend en `ALLOWED_ORIGINS`.
- [x] A2.2 `GET /api/login/me` solo necesita la cookie y entrega un CSRF nuevo, sin alargar la sesión. La sesión sigue funcionando aunque se borre `localStorage`.
- [x] A2.3 Tests: login desde otro sitio → 403; desde el mismo sitio y desde Vite → 200; `/me` renueva el CSRF y conserva el vencimiento; el CSRF anterior deja de servir.

### Parte B — Errores claros ✅

- [x] B.1 En `errorHandler` (`utils/middleware.ts`), traducir los `ValidationError` de Mongoose a un mensaje por campo y en español: `{ error: "Revisa los campos.", fields: { title: "El título es obligatorio." } }`.
- [x] B.2 Mensajes en español: `utils/validation.ts` traduce cada error de Mongoose (`required`, `min`, `max`, `maxlength`, `enum`, formato) sin repetir mensajes en cada schema.
- [x] B.3 Que el 409 diga qué está repetido (por ejemplo, el id de la obra), como ya hace el registro con usuario y correo.
- [x] B.4 Frontend: mostrar el error junto al campo que falló en Gestión, Registro y Login, no solo arriba del formulario.

**Lista cuando:** ningún error visible para el usuario sale en inglés ni con formato técnico.

### Parte C — UI, colores y resolución ✅

**Se decide primero (C.0), porque cambia cómo se hacen D, E, F y G.**

- [x] C.0 UI: se sigue con **CSS propio** (anotado en el README). Confirmar con el grupo; si se cambia a MUI, D/E/F/G no dependen de esa decisión.
  - **Opción 1 — MUI (Material UI)**: componentes listos (`Button`, `Card`, `TextField`, `Dialog`, `Snackbar`, íconos), con el tema y los colores en un solo archivo. Más trabajo al principio: hay que migrar las vistas.
  - **Opción 2 — Seguir con CSS propio**, ordenando la paleta en variables. Menos trabajo, pero sin componentes nuevos.
- [x] C.1 Paleta nueva (sin grises; morado de acento; `--agua` para fondos y `--agua-texto` 7,2:1 para textos; se arregló `color: #rgb(...)` en `artists.css`): quitar los grises (`--muted`, el fondo café/gris de las tarjetas `#24221e`) y elegir el azul nuevo. Con MUI va en `createTheme`; con CSS, en `:root`. Revisar el contraste: texto ≥ 4.5:1 y bordes ≥ 3:1.
- [x] C.2 Resolución (menú sin anchos fijos y en dos líneas en celular; 375, 768, 1024, 1280 y 1920 px sin desborde): quitar los anchos fijos (como el `padding-left` del menú) y probar en 375, 768, 1024, 1280 y 1920 px. Menú usable en celular.

**Lista cuando:** todas las vistas se ven bien en esos 5 anchos y la paleta está en un solo lugar.

### Parte D — Vista "Exposiciones" + gestión por el admin ✅

Depende de: A1 (rol admin) y C.0 (tipo de UI).

- [x] D.1 Backend (además: `featured` = va en el inicio u «Otras exposiciones»; validación de que el término no sea antes del inicio): modelo `Exhibition` (`id`, `title`, `artistId`, `room`, `discipline`, `startDate`, `endDate`, `description`, `imageUrl`) + controlador CRUD con `withUser` + `requireOrganizer`/admin en crear, editar y eliminar. Tests como los de obras.
- [x] D.2 Seed: mover las 4 exposiciones de `Information.tsx` a `data/sampleExhibitions.ts`.
- [x] D.3 Frontend: ruta `/otras-exposiciones` con la lista y el detalle; el inicio muestra un resumen con enlace a la vista.
- [x] D.4 Gestión (en `/gestion/exposiciones`): pestaña "Exposiciones" con crear, editar y eliminar (igual que Obras y Talleres).

### Parte E — Redes en los perfiles ✅

- [x] E.1 Backend: `socials` en `Artist` (Instagram, sitio web, X / Twitter, Behance), solo URLs `https://`, con mensajes en español.
- [x] E.2 Frontend: íconos con enlace en el perfil (`socialPlatforms.tsx`, `target="_blank"` + `rel="noopener noreferrer"` + `aria-label`).
- [x] E.3 Gestión: pestaña **Artistas y Redes** (crear, editar y eliminar artistas con sus redes).

### Parte F — Mejorar la inscripción a talleres ✅

Revisar con el grupo qué falla hoy. Propuestas:

- [x] F.1 Diálogo de confirmación antes de inscribirse, con fecha, sala y duración.
- [x] F.2 Poder cancelar desde la misma tarjeta del taller (hoy solo se puede desde Mi visita).
- [x] F.3 Mostrar los cupos en una barra; marcar "Últimos cupos" y "Lleno".
- [x] F.4 Mensaje de éxito o error que se vea (snackbar/toast), y un enlace a Mi visita.
- [x] F.5 Limpiar las inscripciones viejas del Hito 1 sin `userId` (12 en "Luz y color en acuarela" y 1 en "Composición"): `npm run registrations:clean --workspace backend` las cuenta; con `-- --apply` las borra. Cada uno tiene que correrlo en su base local.

### Parte G — Slideshow de obras ✅

- [x] G.0 Carrusel de obras destacadas arriba del Catálogo (`ArtworkSlideshow`), con avance automático que se pausa y respeta el movimiento reducido.

- [x] G.1 Cada obra puede tener varias imágenes: campo `images` en `Artwork` (hasta 10, rutas `/images/...` o URLs `http(s)`). El organizador las agrega en Gestión → Obras → "Más imágenes de la obra".
- [x] G.2 Página de la obra (`/catalog/:id`): galería que se pasa hacia el lado con flechas, miniaturas, teclado (← →) y deslizando el dedo en el celular. No avanza sola. En el catálogo, la tarjeta muestra "+N imágenes".
- [x] G.3 Accesible: `aria-roledescription="carousel"`, botones con nombre y el texto alternativo dice "imagen N de M".

### Parte H — Presentación

- [ ] H.1 Slides hechas a mano, **listas 2 días antes del deadline** (fecha: ______).
- [ ] H.2 Una demo en vivo por persona, de la parte que hizo; tiempo máximo acordado por persona.

---

## 4. Orden y dependencias

```
Parte 0 (deuda técnica) ──┬──► A: roles + CSRF ──► D: exposiciones (CRUD admin)
                          │
                          ├──► B: errores claros
                          │
                          └──► C.0: decidir UI ──┬──► C.1–C.2: colores y resolución
                                                 ├──► E: redes en perfiles
                                                 ├──► F: inscripción a talleres
                                                 └──► G: slideshow
H: slides, en paralelo; listas 2 días antes del deadline.
```

**Se pueden hacer en paralelo:** A, B y C.0 apenas termine la Parte 0. E, F y G, cuando C.0 esté decidida.

---

## 5. Decisiones pendientes del grupo

1. **UI:** ¿MUI u otra librería, o CSS propio? (bloquea C, D, E, F y G).
2. ~~**Rol admin**~~ — decidido: `organizador`, `@admin.expo.cl`, creado por script.
3. **"Login CSRF":** confirmar con el feedback del profesor qué se pidió.
4. **Inscripción a talleres:** ¿cuáles de F.1–F.4 hacemos?
5. **Slideshow:** ¿va en el Catálogo, en la página de cada obra o en ambos?
6. **Fecha del deadline** del Hito 3, para fijar el día de las slides.

---

## 6. Convenciones (igual que en el Hito 2)

- Node 22 (`nvm use 22`). Una rama por parte (`parte-a-roles`, `parte-c-ui`, …) y se mergea a `hito2` cuando sus tests pasan.
- Nunca se sube el `.env`; toda variable nueva va también a `.env.example`.
- `runValidators: true` en toda actualización. Sin `any`. DOM solo vía React.
