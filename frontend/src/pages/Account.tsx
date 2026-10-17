import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Account() {
  const { user } = useAuth();
  return (
    <section className="status" aria-labelledby="account-title">
      <p className="eyebrow">EXPO / CUENTA</p>
      <h1 id="account-title">Hola, {user?.name}.</h1>
      <p>Tu sesión está activa. La vista “Mi visita” se incorporará en la siguiente parte del plan.</p>
      <Link className="button" to="/workshops">Ver talleres</Link>
    </section>
  );
}
