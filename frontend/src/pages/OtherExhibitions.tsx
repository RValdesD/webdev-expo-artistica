import { Link } from 'react-router-dom';
import '../styles/exhibitions.css';
export default function OtherExhibitions() {
  return <section className="section other-expos" aria-labelledby="other-expos-title">
    <Link to="/">← Volver al inicio</Link>
    <h1 id="other-expos-title">Otras exposiciones</h1>
    <ul className="other-expos__list">
      {[1, 2, 3, 4].map(id => <li key={id}><Link to={`/otras-exposiciones/placeholder-${id}`}>placeholder</Link><span>00/00/00</span></li>)}
    </ul>
  </section>;
}
export function PlaceholderExhibition() {
  return <section className="section"><Link to="/otras-exposiciones">← Otras exposiciones</Link><h1>placeholder</h1><p>00/00/00</p></section>;
}
