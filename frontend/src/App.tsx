import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import Information from "./pages/Information";
import ArtistList from "./pages/ArtistList";
import ArtistDetail from "./pages/ArtistDetail";
import Catalog from './pages/Catalog';
import Workshops from './pages/Workshops';

export default function App() {
  return (
    <BrowserRouter>
      <a className="skip-link" href="#main">Saltar al contenido</a>
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Expo Artística, inicio"> EXPO ARTÍSTICA SANTIAGO</Link>
        <nav aria-label="Navegación principal">
          <NavLink to="/information">Información</NavLink>
          <NavLink to="/artists">Artistas</NavLink>
          <NavLink to="/catalog">Catálogo</NavLink>
          <NavLink to="/workshops">Workshops</NavLink>
          <Link to="/#visit">Planifica tu visita</Link>
        </nav>

          <a
            className="auth-link"
            href="#"
            onClick={(event) => event.preventDefault()}
          >
            Crear cuenta / Iniciar sesión
          </a>

      </header>
      <main id="main">
        <Routes>
          <Route path="/" element={<Information />} />
          <Route path="/information" element={<Information />} />
          <Route path="/artists" element={<ArtistList />} />
          <Route path="/artists/:id" element={<ArtistDetail />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/workshops" element={<Workshops />} />
          <Route path="*" element={<section className="status"><h1>Página no encontrada</h1><Link to="/">Volver al inicio</Link></section>} />
        </Routes>
      </main>
      <footer className="site-footer">
        <span>EXPO ARTÍSTICA SANTIAGO</span>
        <p>Proyecto CC5003 · Aplicaciones Web Reactivas · Equipo Los Patos Malos</p>
      </footer>
    </BrowserRouter>
  );
}

