# Expo Artística Santiago

Aplicación web para una exposición de arte: los visitantes exploran los artistas y las obras que se presentan y se inscriben a talleres prácticos.

Proyecto del curso CC5003 — Aplicaciones Web Reactivas. Equipo **Los Patos Malos**.

## Estructura

```
frontend/   React + TypeScript + Vite (SPA con React Router)
backend/    Express + Mongoose + TypeScript sobre MongoDB
```

## Requisitos

- **Node.js 22.18 o superior.** El backend ejecuta TypeScript directamente con `node`. Con nvm: `nvm use` (lee el `.nvmrc`).
- **MongoDB** corriendo en local (`mongodb://127.0.0.1:27017`).

## Variables de entorno

El backend lee `backend/.env`, que **no se sube al repositorio**. Copia el ejemplo y completa los valores:

```bash
cd backend
cp .env.example .env
```

| Variable | Para qué sirve |
|---|---|
| `MONGODB_URI` | Dirección de MongoDB |
| `MONGODB_DB_NAME` | Base de datos de desarrollo |
| `PORT` | Puerto del backend (3001) |
| `TEST_MONGODB_URI` | Dirección de MongoDB para los tests |
| `TEST_MONGODB_DB_NAME` | Base de datos de los tests (se vacía en cada ejecución) |
| `JWT_SECRET` | Secreto para firmar los JWT. Genera uno con `openssl rand -hex 32` |

## Ejecutar en local

**Terminal 1: backend** (queda en `http://localhost:3001`)

```bash
cd backend
npm install
npm run seed     # carga los datos de ejemplo; se puede repetir sin duplicar
npm run dev
```

**Terminal 2: frontend** (queda en `http://localhost:5173`; las rutas `/api` van al backend)

```bash
cd frontend
npm install
npm run dev
```

## Scripts del backend

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor en desarrollo, se reinicia al guardar |
| `npm run seed` | Carga expo, artistas, obras y talleres de ejemplo |
| `npm test` | Corre los tests de `tests/` sobre la base de tests |
| `npm run typecheck` | Revisa los tipos de `src/` y `tests/` |
| `npm run build:ui` | Compila el frontend y lo copia a `backend/dist` para desplegar |

## Aplicación desplegada

_Pendiente (Parte G del plan)._

## Integrantes

- Diego Alonso Cornejo Santibáñez
- Igor Assis Passos de Souza
- Juxin Xu
- Rodrigo Sebastián Valdés Delanghe
- Vicente Salvador Arturo Valdebenito Acuña
