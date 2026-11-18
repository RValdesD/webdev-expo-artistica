# Art Expo — Estado actual y ejecución

Aplicación React + TypeScript con una API Express + TypeScript y MongoDB/Mongoose. Esta versión adapta el proyecto existente al plan de Hito 2 sin reemplazar su diseño visual personalizado.

Se conservaron el encabezado **EXPO ARTÍSTICA SANTIAGO**, el tema **Los Grandes Mares**, la paleta oscura, la composición de la página de información y la imagen `frontend/public/images/FISH.png` del proyecto entregado.

## Qué incluye este checkpoint

- Información, artistas, catálogo y talleres públicos.
- Registro e inicio de sesión por nombre de usuario.
- Sesión JWT en una cookie `httpOnly`, `SameSite=Strict` y `Secure` en producción.
- Protección CSRF mediante un valor independiente enviado en `X-CSRF-Token`.
- Restauración y cierre de sesión en React.
- Inscripción autenticada a talleres, sin confiar en datos de identidad enviados por el navegador.
- Vista protegida **Mi visita** con próximo taller, todas las inscripciones del usuario y cancelación.
- Panel protegido **Gestión** con pestañas para crear, editar y eliminar obras y talleres.
- CRUD de exposición, artistas, obras y talleres en la API. Las escrituras requieren sesión, CSRF y rol organizador.
- Validación de relaciones entre artistas, obras y talleres.
- Seed consolidado e idempotente: agrega muestras ausentes sin sobrescribir documentos existentes.
- Manejo centralizado de errores y pruebas de autenticación.

### Arreglos posteriores al Hito 2 (ver `PLAN_HITO3.md`)

- Cuentas organizadoras creadas por script con el dominio configurado (`admin.expo.cl` por defecto); login y registro validan Origin/Referer con `requireSameOrigin`.
- Errores en español y por campo, mostrados junto al campo que falló (Gestión, Registro e Inicio de sesión).
- Exposiciones administrables: las destacadas van en el inicio y las demás en **Otras exposiciones** (`/otras-exposiciones`), con sala, disciplina, artista y fechas.
- Redes (Instagram, sitio web, X / Twitter, Behance) en el perfil de cada artista, editables en Gestión → Artistas y Redes.
- Inscripción a talleres con confirmación, cancelación desde la tarjeta, barra de cupos y aviso.
- Carrusel de obras en el Catálogo y galería de varias imágenes de la misma obra en `/catalog/:id`.
- Ajustes responsive para 375, 768, 1024, 1280 y 1920 px; la verificación visual en navegador queda pendiente (ver resultados al final).

### Interfaz

La interfaz usa **CSS propio**, sin librería de componentes. Los colores están en variables al inicio de `frontend/src/styles.css` (`:root`) y cada vista tiene su archivo en `frontend/src/styles/`. Los ajustes compartidos están en `frontend/src/styles/responsive.css`, importado al final en `main.tsx` para que prevalezca sobre los estilos de cada vista. Para textos sobre el fondo negro se usa `--agua-texto` (contraste 7,2:1); `--agua` es para fondos de botones con texto blanco.

Las dos vistas nuevas del Hito 2 están implementadas. Gestión y todas las escrituras de contenido requieren el rol `organizador`; las cuentas nuevas son `visitante`.

## Roles y primer organizador

| Acción | Visitante | Organizador |
|---|---|---|
| Ver exposición, artistas, obras y talleres | Sí | Sí |
| Inscribirse, ver Mi visita y cancelar su inscripción | Sí | Sí |
| Abrir Gestión y crear/editar/eliminar contenido | No | Sí |

Con MongoDB funcionando y `backend/.env` configurado, crea el primer organizador desde la raíz:

```sh
npm run user:create-admin --workspace backend -- administrador administrador@admin.expo.cl "Administrador"
```

El comando pide una contraseña. Usa el dominio de `ADMIN_EMAIL_DOMAIN`: si configuraste `admin.com`, el correo debe terminar en `@admin.com`. No se concede acceso solo por escribir ese correo en el formulario público; ese formulario rechaza el dominio reservado.

Para cambiar el rol de una cuenta existente:

```sh
npm run user:role --workspace backend -- administrador visitante
npm run user:role --workspace backend -- administrador organizador
```

La promoción solo acepta correos del dominio administrador. Cambiar el rol no cambia la contraseña. Recarga la página para actualizar el menú. Las cuentas nuevas del registro público son visitantes y se ignora cualquier rol enviado por el navegador.

El servidor consulta el rol actual en MongoDB en cada escritura administrativa. Cambiar localStorage o falsificar un campo role no concede permisos; al degradar un organizador, su JWT anterior deja de autorizar escrituras inmediatamente. El menú refleja el cambio al recargar.

## Requisitos

- Node.js 22 o posterior.
- npm.
- MongoDB Community instalado y ejecutándose, o una URI de MongoDB Atlas.
- MongoDB Compass es opcional: sirve para inspeccionar y editar datos, pero no inicia ni reemplaza el servidor de MongoDB.

## Preparación

Desde la carpeta raíz del proyecto:

```sh
npm install
```

Copia `backend/.env.example` como `backend/.env`. Genera un secreto; por ejemplo:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Pega el resultado en `JWT_SECRET`. Una configuración local típica es:

```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DBNAME=art_expo
PORT=3001
HOST=127.0.0.1
JWT_SECRET=pega-aqui-un-secreto-largo-y-aleatorio
ADMIN_EMAIL_DOMAIN=admin.expo.cl
# En producción: origen HTTPS real del sitio (sin ruta)
# ALLOWED_ORIGINS=https://tu-dominio
```

Con MongoDB activo, carga los datos de demostración:

```sh
npm run seed
```

El seed puede ejecutarse de nuevo: conserva los documentos que ya existen.

## Desarrollo

Terminal 1, API:

```sh
npm run server
```

Terminal 2, React:

```sh
npm run dev
```

Abre la URL mostrada por Vite, normalmente `http://localhost:5173`. Vite reenvía `/api` a `http://127.0.0.1:3001` mediante `frontend/vite.config.ts`.

Rutas nuevas del frontend:

- `/mi-visita`: perfil protegido del visitante y sus inscripciones.
- `/gestion`: panel exclusivo para organizadores para administrar obras, talleres y artistas.
- `/gestion/exposiciones`: exposiciones del inicio y de «Otras exposiciones».
- `/otras-exposiciones` y `/otras-exposiciones/:id`: listado y detalle públicos.
- `/catalog/:id`: obra con su galería de imágenes.

## Rutas principales

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| POST | `/api/users` | Público | Crear usuario |
| POST | `/api/login` | Público | Iniciar sesión y recibir CSRF |
| GET | `/api/login/me` | Cookie de sesión | Restaurar sesión y renovar CSRF sin extender su vencimiento |
| POST | `/api/login/logout` | Sesión + CSRF | Cerrar sesión |
| GET | `/api/expo` | Público | Información de la exposición |
| PUT | `/api/expo` | Organizador + CSRF | Editar la exposición |
| GET | `/api/artists`, `/api/artworks`, `/api/workshops`, `/api/exhibitions` | Público | Listados y detalles |
| POST/PUT/DELETE | recursos anteriores | Organizador + CSRF | Gestión CRUD |
| POST | `/api/workshops/:id/registrations` | Sesión + CSRF | Inscribirse a un taller |
| GET | `/api/registrations/me` | Sesión + CSRF | Listar mis inscripciones |
| DELETE | `/api/workshops/:id/registrations` | Sesión + CSRF | Cancelar mi inscripción |

El frontend guarda únicamente el valor CSRF en `localStorage`. El JWT permanece dentro de la cookie `httpOnly` y no puede ser leído por JavaScript.

## Estructura importante

```text
backend/src/
  app.ts                 middleware y rutas
  index.ts               conexión y arranque
  controllers/           routers por recurso
  models/                esquemas Mongoose
  utils/                 configuración, logger y middleware
  seed.ts                seed único
frontend/src/
  stores/authStore.ts    estado global de sesión (Zustand)
  stores/artistsStore.ts estado global de artistas (Zustand, lista en memoria)
  components/            UI y ProtectedRoute
  pages/                 vistas del Router
  services/              solicitudes HTTP por recurso
  utils/axiosSecure.ts   cookie + encabezado CSRF
e2etests/                pruebas E2E con Playwright
playwright.config.ts     configuración de Playwright
```

## Estado global (Zustand)

- `useAuthStore` (`frontend/src/stores/authStore.ts`): usuario conectado, `loading`, `unavailable` y las acciones `login`, `logout` y `refresh`. Al abrir o recargar la página, `main.tsx` llama a `refresh()` para restaurar la sesión desde la cookie. Lo usan `AuthNav`, `ProtectedRoute`, `Login`, `MyVisit`, `Workshops`, `WorkshopCard` y otras vistas.
- `useArtistsStore` (`frontend/src/stores/artistsStore.ts`): lista de artistas compartida por `/artists`, `/gestion`, `/gestion/exposiciones` y `/otras-exposiciones`. Si la lista se cargó hace menos de un minuto, no se vuelve a pedir; después de crear, editar o borrar un artista se recarga con `load(true)`.

## Portadas, imágenes de obras y visitas

- **Portadas de exposiciones:** en Gestión → Exposiciones se elige la portada entre las imágenes de `frontend/public/images/` (sin subcarpetas). Para agregar una, copia el archivo a esa carpeta y recarga Gestión; en producción hay que volver a compilar (`npm run build`). El servidor rechaza una portada que no esté en la carpeta.
- **Imágenes de obras:** al enviar una obra desde Mi perfil, el artista sube la imagen principal y hasta 10 imágenes adicionales. Al aprobarla, todas pasan a la galería de `/catalog/:id`.
- **Planifica tu visita:** `/visitas` lista las exposiciones con sus visitas guiadas; `/visitas/:id` muestra sala, fechas, horario y recomendaciones de esa exposición (se editan en Gestión → Exposiciones) y sus visitas guiadas.
- **Visitas guiadas:** se programan en Gestión → Visitas guiadas. Se reservan con una cuenta, con cupos que no se pueden sobrepasar, y aparecen en Mi visita junto a los talleres. Una exposición con visitas guiadas no se puede eliminar hasta borrar sus visitas.

## Verificación

```sh
npm run build
npm test
npm run test:integration
```

### Pruebas E2E (Playwright)

```sh
npx playwright install chromium   # solo la primera vez
npm run test:e2e
```

No hace falta tener levantados el backend ni MongoDB: Playwright compila el frontend y levanta `backend/tests/e2eServer.ts` en `http://127.0.0.1:3002` con un MongoDB en memoria (no toca la base de datos real). Antes de cada prueba se reinicia la base con `POST /api/testing/reset`, ruta que solo existe con `NODE_ENV=test`.

| Archivo | Qué prueba |
|---|---|
| `e2etests/auth.spec.ts` | Login y acceso a `/mi-visita` (ruta protegida); la sesión sigue tras F5; sin sesión redirige a `/login`; contraseña incorrecta; un visitante no entra a `/gestion` |
| `e2etests/artists-crud.spec.ts` | CRUD de artistas desde `/gestion`: crear, verlo en `/artists`, editar y eliminar |
| `e2etests/covers.spec.ts` | El organizador elige la portada de una exposición entre las imágenes de `frontend/public/images/` y se ve en el inicio y en Visitas |
| `e2etests/artwork-images.spec.ts` | Un artista envía una obra con varias imágenes, el organizador la aprueba y la galería de la obra muestra las tres |
| `e2etests/visits.spec.ts` | Visita por exposición desde el inicio, índice de Visitas, reservar y cancelar una visita guiada (también en Mi visita) y crear una visita guiada desde Gestión |
| `e2etests/router.spec.ts` | Atrás, adelante y F5 en `/artists/:id`; ruta inexistente; la lista de artistas sale del store sin pedirla otra vez; el servidor devuelve `index.html` en las rutas de la app, 404 en archivos inexistentes y los encabezados de caché correctos |

Para ver las pruebas en el navegador: `npx playwright test --headed` o `npx playwright test --ui`.

`npm test` no necesita un servidor MongoDB real. `npm run test:integration` inicia un MongoDB temporal aislado y puede descargar su binario la primera vez; necesita permiso para ejecutarlo. Para comprobar el recorrido completo, inicia MongoDB, ejecuta el seed, levanta ambos procesos, crea una cuenta en `/registro`, inicia sesión en `/login`, inscríbete desde `/workshops`, revisa la inscripción en `/mi-visita` y prueba el CRUD desde `/gestion`.

## Códigos y errores

- `400`: datos o JSON inválidos.
- `401`: sesión ausente, vencida o CSRF incorrecto.
- `403`: permisos insuficientes, origen no permitido o correo administrador reservado en el registro público.
- `404`: recurso inexistente.
- `409`: identificador duplicado, relación que impide borrar o inscripción incompatible.
- `500`: error interno no previsto.

La API responde errores con la forma `{ "error": "mensaje" }`. Cuando el problema es de un campo, agrega `fields`, con un mensaje por campo:

```json
{ "error": "Revisa los campos: título, año.", "fields": { "title": "Este campo es obligatorio.", "year": "El año debe ser un entero." } }
```


## Revisión de esta entrega — 15 de noviembre de 2026

### Cambios realizados

- Márgenes y separación fluidos; imágenes contenidas y textos largos que pueden partirse sin ocultar el desborde.
- Navegación en varias filas cuando falta espacio; los enlaces de sesión pasan a su propia fila en teléfono.
- Inicio en una columna por debajo de 1024 px; tarjetas en una columna en teléfono y dos o tres según el ancho.
- Gestión en una columna por debajo de 1280 px, con pestañas y acciones que se acomodan al ancho disponible.
- Carrusel con imagen a todo el ancho y flechas debajo en teléfono; indicadores con áreas táctiles de 44 px.
- Formularios, fechas y filas de imágenes apilados en pantallas pequeñas; diálogo de taller con altura limitada y desplazamiento vertical.
- Se eliminó una llave de cierre sobrante en `backend/src/controllers/users.ts`, después de la validación, que impedía compilar y arrancar el backend. Se conserva el mensaje descriptivo de registro.

### Verificación realizada

| Comprobación | Resultado |
|---|---|
| `npm run build` | Frontend y backend compilan correctamente |
| `npm test` | 60 pruebas aprobadas |
| `npm run test:integration` | Pendiente: MongoDB temporal abortó con SIGABRT al iniciar; los 33 casos no pudieron validarse |
| Revisión CSS y estructura | Realizada para los componentes y rutas actuales |
| Renderizado en los cinco anchos | Pendiente: Chromium no pudo iniciar porque el entorno rechazó la creación de su socket |

No se afirma que la revisión visual ni la integración real hayan pasado. Las marcas de completado en `PLAN_HITO3.md` y las casillas históricas de `PLAN_HITO2.md` no sustituyen estos resultados.

### Qué falta por hacer

- [ ] Abrir todas las vistas a 375, 768, 1024, 1280 y 1920 px, y a anchos intermedios; comprobar que no haya desplazamiento horizontal, recortes ni controles inaccesibles.
- [ ] Revisar también una pantalla baja/en horizontal, zoom de 200 %, textos largos, errores, estados vacíos y los menús de visitante y organizador; probar en Firefox y en un teléfono real.
- [ ] Ejecutar `npm run test:integration` en un equipo que pueda arrancar MongoDB temporal y verificar los 33 casos.
- [ ] Recorrer la app contra el backend y MongoDB reales: registro, login, restauración, logout, permisos, CRUD, inscripción y cancelación.
- [ ] Completar accesibilidad del diálogo de talleres: actualmente no implementa captura/restauración del foco ni cierre con Escape; revisar también la navegación por teclado de las pestañas de Gestión.
- [ ] Confirmar con el grupo la paleta definitiva. Aún existen fondos oscuros/grises y valores locales en los CSS; la afirmación del plan de una paleta totalmente centralizada y «sin grises» no está totalmente cumplida.
- [ ] Revisar los datos de muestra antes de presentar: las FAQ del seed aún describen artistas, catálogo y talleres como funcionalidades futuras. Editar los datos existentes; el seed no los sobrescribe.
- [ ] Si hay inscripciones antiguas sin `userId`, ejecutar primero `npm run registrations:clean --workspace backend`; revisar el resultado antes de usar `-- --apply`.
- [ ] Publicar o verificar el despliegue HTTPS y agregar su URL real al README; comprobar cookies, `ALLOWED_ORIGINS` y acceso directo a rutas como `/catalog/:id`.
- [ ] Configurar/verificar CI: este ZIP no contiene `.github/workflows`, por lo que no se puede afirmar que GitHub Actions ejecute los tests.
- [ ] Actualizar el estado de los planes históricos y confirmar con el profesor el alcance de la protección CSRF solicitada para login.
- [ ] Completar la parte H del plan: fijar fecha de entrega, preparar las diapositivas dos días antes y repartir/ensayar las demostraciones.

### Recorrido para validar el responsive

Con frontend, backend y base de datos activos, usar el modo responsive de DevTools y cambiar el ancho sin recargar entre 375, 768, 1024, 1280 y 1920 px. Revisar inicio (ambas exposiciones), Visitas, artistas y perfil, catálogo/carrusel y galería, talleres/confirmación, Otras exposiciones/detalle, login, registro, Mi visita, las tres pestañas de Gestión y Gestión de exposiciones. Repetir con una cuenta visitante y otra organizadora. El diseño debe seguir funcionando entre esos anchos, no solo en las cinco medidas.
