import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
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
          <Link to="/information">Información</Link>
          <Link to="/artists">Artistas</Link>
          <Link to="/catalog">Catálogo</Link>
          <Link to="/workshops">Workshops</Link>
          <a href="/#visit">
            Planifica tu visita
          </a>
        </nav>

          <a
            className="auth-link"
            href="#"
            onClick={(event) => event.preventDefault()}
          >
            Crear Cuenta / Iniciar Sesion
          </a>

      </header>
      <main id="main">
        <Routes>
          <Route path="/" element={<Information />} />
          <Route path="/information" element={<Information />} />
          <Route path="/artists" element={<ArtistList />} />
          <Route path="/artists/:id" element={<ArtistDetail />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="*" element={<section className="status"><h1>Página no encontrada</h1><Link to="/">Volver al inicio</Link></section>} />
          <Route path="/workshops" element={<Workshops />} />
        </Routes>
      </main>
      <footer className="site-footer"><span></span></footer>
    </BrowserRouter>
  );
}

