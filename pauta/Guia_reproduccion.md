# Guía para reproducir y validar la solución

Esta guía está diseñada para que puedas **reproducir** el proyecto y **verificar** que la solución cumple con los requerimientos planteados en el laboratorio.

---

## 1. Prerrequisitos

- **Node.js** (versión 18 o superior) y **npm** instalados.
- **PowerShell** o **CMD** con privilegios de **Administrador** (necesario para instalar paquetes dentro de la carpeta sincronizada con OneDrive).
- Conexión a internet para descargar los paquetes de npm.

---

## 2. Preparar el entorno de trabajo

1. **Abrir PowerShell como Administrador**
   ```
   # En el menú Inicio busca "PowerShell", haz clic derecho y elige "Ejecutar como administrador"
   ```
2. (Opcional) **Desactivar la sincronización de OneDrive** para la carpeta del proyecto o mover el proyecto fuera de OneDrive para evitar problemas de permisos.
   ```
   # Mover el proyecto (ejemplo) a una ubicación sin OneDrive
   Move-Item "C:\Users\dieal\OneDrive\Escritorio\webdev-expo-artistica" "C:\Proyectos\webdev-expo-artistica"
   ```
3. Navegar al directorio `frontend` del proyecto.
   ```
   cd "C:\Users\dieal\OneDrive\Escritorio\webdev-expo-artistica\frontend"
   ```

---

## 3. Instalar dependencias (MUI y demás)

Ejecuta el siguiente comando **en modo administrador**:
```powershell
npm install
```
Esto descargará e instalará todas las dependencias declaradas en `package.json`, incluyendo los paquetes de **Material‑UI** (`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`).

> **Nota:** Si vuelves a obtener un error `EPERM` o `Access denied`, revisa que no haya procesos (editores, terminales, etc.) que tengan abiertos archivos dentro de `node_modules`. Cierra esas aplicaciones y vuelve a intentar.

---

## 4. Verificar que la compilación sea exitosa

### 4.1 Compilación de desarrollo
```powershell
npm run dev
```
- Se abrirá el servidor Vite en `http://localhost:5173`.
- Navega por el sitio y verifica que **no aparezcan errores de importación** (por ejemplo, `Cannot find module '@mui/material'`).
- Revisa que el **tema oscuro** y los **estilos personalizados** se apliquen correctamente.

### 4.2 Compilación de producción
```powershell
npm run build
```
- El comando generará la carpeta `dist/`.
- Si el build finaliza sin errores, la solución está lista para producción.

---

## 5. Revisar la correctitud de la solución

1. **Compilación TypeScript** (sin generar archivos):
   ```powershell
   npx tsc --noEmit
   ```
   - No debe haber errores ni advertencias.
2. **Linting (si está configurado)**:
   ```powershell
   npm run lint   # o npx eslint src/**/*.{js,ts,tsx}
   ```
   - Corrige cualquier regla que falle.
3. **Test de UI (opcional)**:
   - Si el proyecto contiene pruebas con **Vitest** o **Jest**, ejecútalas:
     ```powershell
     npm test
     ```
   - Asegúrate de que todas pasen.
4. **Comparar con la plantilla original**
   - En la carpeta `Codigos_base\Template_rellenado\Template_Laboratorio_08` encontrarás el **template rellenado** que debe coincidir con la estructura del proyecto.
   - Usa la herramienta `git diff` (o cualquier comparador de archivos) para validar que los archivos modificados coinciden con los esperados.

---

## 6. Puntos clave de la integración de Material‑UI

- El **tema** está definido en `frontend/src/theme.ts` y se aplica mediante `ThemeProvider` en `frontend/src/main.tsx`.
- Se han sobrescrito componentes comunes (Botones, Card, Dialog) para que adopten la paleta de colores del proyecto.
- Los **estilos CSS tradicionales** siguen presentes, pero ahora usan variables que coinciden con la paleta del tema MUI, evitando conflictos visuales.
- **Header** no se ha modificado, tal como se solicitó.

---

## 7. Próximos pasos (si todo funciona)

- **Commit** de los cambios con un mensaje descriptivo:
  ```bash
  git add .
  git commit -m "Add MUI theme, redesign UI, fix permission issue"
  ```
- **Deploy** a la plataforma de hosting que prefieras (Netlify, Vercel, etc.).
- Si deseas añadir más componentes MUI (por ejemplo, `Tabs`, `Accordion`, `Snackbar`), sigue la misma estrategia: importa el componente desde `@mui/material` y aplica los overrides en `theme.ts` si es necesario.

---

## 8. Preguntas frecuentes

| Pregunta | Respuesta |
|----------|-----------|
| **¿Qué hago si sigue apareciendo `EPERM`?** | Cierra todas las aplicaciones que puedan estar usando la carpeta (VS Code, explorador de archivos, terminales). Si el problema persiste, copia el proyecto a una ruta fuera de OneDrive o ejecuta el comando con **Run as administrator**.
| **¿Cómo cambio la tipografía del tema?** | Edita los valores de `typography` dentro de `theme.ts`. Los cambios se reflejarán automáticamente gracias a `CssBaseline`.
| **¿Puedo usar clases CSS con componentes MUI?** | Sí, puedes añadir `className` a cualquier componente MUI y seguir reutilizando los estilos definidos en los archivos `.css`.

---

*Esta guía ha sido generada automáticamente por el asistente Antigravity. Si necesitas más ayuda, no dudes en preguntar.*
