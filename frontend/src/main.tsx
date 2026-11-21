import React from 'react';
import ReactDOM from 'react-dom/client';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { useAuthStore } from './stores/authStore';
import theme from './theme';
import './styles.css';
import './styles/responsive.css';
import './styles/themes.css';

// Al abrir o recargar la página (F5) se comprueba si sigue la sesión guardada en la cookie.
void useAuthStore.getState().refresh();

// This is only React's mounting point, not manual UI manipulation.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* injectFirst: los estilos de MUI van antes que los .css del proyecto, así las clases propias pueden ajustarlos. */}
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>
);
