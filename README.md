# Art Expo — Hito 2

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
- CRUD de exposición, artistas, obras y talleres en la API. Las escrituras requieren autenticación.
- Validación de relaciones entre artistas, obras y talleres.
- Seed consolidado e idempotente: agrega muestras ausentes sin sobrescribir documentos existentes.
- Manejo centralizado de errores y pruebas de autenticación.

Las dos vistas nuevas del Hito 2 están implementadas. Gestión y todas las escrituras de contenido requieren el rol `organizador`; las cuentas nuevas son `visitante`.

## Roles y primer organizador

| Acción | Visitante | Organizador |
|---|---|---|
| Ver exposición, artistas, obras y talleres | Sí | Sí |
| Inscribirse, ver Mi visita y cancelar su inscripción | Sí | Sí |
| Abrir Gestión y crear/editar/eliminar contenido | No | Sí |

Crea primero una cuenta desde /registro. Desde la raíz, con MongoDB funcionando y backend/.env configurado, ejecuta (reemplaza ana por el usuario real):

```sh
npm run user:role --workspace backend -- ana organizador
```

Desde la carpeta backend el equivalente es:

```sh
npm run user:role -- ana organizador
```

Recarga la página para restaurar la sesión y mostrar Gestión. No hay nuevas variables de entorno ni contraseñas predeterminadas. Para retirar el permiso:

```sh
npm run user:role --workspace backend -- ana visitante
```

Este comando actualiza únicamente el rol de una cuenta existente. Las cuentas anteriores sin role se tratan como visitantes; no hace falta borrar usuarios ni volver a ejecutar el seed. El registro público ignora cualquier role enviado por el navegador.

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
- `/gestion`: panel exclusivo para organizadores para administrar obras y talleres.

## Rutas principales

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| POST | `/api/users` | Público | Crear usuario |
| POST | `/api/login` | Público | Iniciar sesión y recibir CSRF |
| GET | `/api/login/me` | Sesión + CSRF | Restaurar sesión |
| POST | `/api/login/logout` | Sesión + CSRF | Cerrar sesión |
| GET | `/api/expo` | Público | Información de la exposición |
| PUT | `/api/expo` | Organizador + CSRF | Editar la exposición |
| GET | `/api/artists`, `/api/artworks`, `/api/workshops` | Público | Listados y detalles |
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
  auth/AuthContext.tsx   estado global de sesión
  components/            UI y ProtectedRoute
  pages/                 vistas del Router
  services/              solicitudes HTTP por recurso
  utils/axiosSecure.ts   cookie + encabezado CSRF
```

## Verificación

```sh
npm run build
npm test
```

Las pruebas no necesitan una instancia real de MongoDB. Para comprobar el recorrido completo, inicia MongoDB, ejecuta el seed, levanta ambos procesos, crea una cuenta en `/registro`, inicia sesión en `/login`, inscríbete desde `/workshops`, revisa la inscripción en `/mi-visita` y prueba el CRUD desde `/gestion`.

## Códigos y errores

- `400`: datos o JSON inválidos.
- `401`: sesión ausente, vencida o CSRF incorrecto.
- `403`: usuario autenticado sin permisos de organizador.
- `404`: recurso inexistente.
- `409`: identificador duplicado, relación que impide borrar o inscripción incompatible.
- `500`: error interno no previsto.

La API responde errores con la forma `{ "error": "mensaje" }`.
