import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import Information from './pages/Information';
import OtherExhibitions, { PlaceholderExhibition } from './pages/OtherExhibitions';
import ExhibitionManagement from './pages/ExhibitionManagement';
import Visits from './pages/Visits';
import ArtistList from "./pages/ArtistList";
import ArtistDetail from "./pages/ArtistDetail";
import Catalog from './pages/Catalog';
import Workshops from './pages/Workshops';
import Signup from './pages/Signup';
import Login from './pages/Login';
import AuthNav from './components/AuthNav';
import ProtectedRoute from './components/ProtectedRoute';
import MyVisit from './pages/MyVisit';
import Management from './pages/Management';

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
          <Link to="/visitas">
            Planifica tu visita
          </Link>
          <AuthNav />
        </nav>
      </header>
      <main id="main">
        <Routes>
          <Route path="/" element={<Information />} />
          <Route path="/information" element={<Information />} />
          <Route path="/otras-exposiciones" element={<OtherExhibitions />} />
          <Route path="/otras-exposiciones/:id" element={<PlaceholderExhibition />} />
          <Route path="/gestion/exposiciones" element={<ProtectedRoute organizerOnly><ExhibitionManagement /></ProtectedRoute>} />
          <Route path="/visitas" element={<Visits />} />
          <Route path="/artists" element={<ArtistList />} />
          <Route path="/artists/:id" element={<ArtistDetail />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/workshops" element={<Workshops />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/registro" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/mi-visita" element={<ProtectedRoute><MyVisit /></ProtectedRoute>} />
          <Route path="/cuenta" element={<ProtectedRoute><MyVisit /></ProtectedRoute>} />
          <Route path="/gestion" element={<ProtectedRoute organizerOnly><Management /></ProtectedRoute>} />
          <Route path="*" element={<section className="status"><h1>Página no encontrada</h1><Link to="/">Volver al inicio</Link></section>} />
        </Routes>
      </main>
      <footer className="site-footer"><span></span></footer>
    </BrowserRouter>
  );
}
