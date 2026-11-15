import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiError, apiFields } from '../services/auth';
import FieldError, { fieldProps, type FieldErrors } from '../components/FieldError';
import usersService from '../services/users';
import '../styles/auth.css';

export default function Signup() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(false);
  const [fields, setFields] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (password !== confirmation) {
      setError('Revisa los campos marcados.');
      setFields({ confirmation: 'No coincide con la contraseña.' });
      return;
    }
    setBusy(true);
    setError('');
    setFields({});
    try {
      await usersService.register({ name: name.trim(), username: username.trim(), email: email.trim(), password });
      setPassword('');
      setConfirmation('');
      setCreated(true);
    } catch (reason: unknown) {
      // Si el error es de un campo, el detalle va junto al campo y arriba del botón solo un aviso corto.
      const byField = apiFields(reason);
      setFields(byField);
      setError(Object.keys(byField).length ? 'Revisa los campos marcados.' : apiError(reason));
    }
    finally { setBusy(false); }
  }

  return (
    <section className="auth-page">
      <p className="eyebrow">EXPO / CLIENTES</p>
      <h1>Crear cuenta</h1>
      <p className="auth-page__intro">Con tu cuenta puedes inscribirte en talleres y armar tu visita.</p>
      {created ? (
        <div role="status"><p>Tu cuenta está creada.</p><Link className="button" to="/login">Iniciar sesión</Link></div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="signup-name">Nombre</label>
          <input id="signup-name" {...fieldProps(fields, 'name', 'signup-name')} autoComplete="name" required maxLength={120} value={name} onChange={event => setName(event.target.value)} disabled={busy} />
          <FieldError fields={fields} name="name" id="signup-name" />
          <label htmlFor="signup-username">Usuario</label>
          <input id="signup-username" {...fieldProps(fields, 'username', 'signup-username')} autoComplete="username" required minLength={3} maxLength={40} pattern="[a-zA-Z0-9._-]+" value={username} onChange={event => setUsername(event.target.value)} disabled={busy} />
          <FieldError fields={fields} name="username" id="signup-username" />
          <label htmlFor="signup-email">Correo</label>
          <input id="signup-email" {...fieldProps(fields, 'email', 'signup-email')} type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} disabled={busy} />
          <FieldError fields={fields} name="email" id="signup-email" />
          <label htmlFor="signup-password">Contraseña</label>
          <input id="signup-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} disabled={busy} aria-invalid={fields.password ? true : undefined} aria-describedby={fields.password ? 'password-help signup-password-error' : 'password-help'} />
          <small id="password-help">Entre 8 y 128 caracteres.</small>
          <FieldError fields={fields} name="password" id="signup-password" />
          <label htmlFor="signup-confirmation">Repite la contraseña</label>
          <input id="signup-confirmation" {...fieldProps(fields, 'confirmation', 'signup-confirmation')} type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={busy} />
          <FieldError fields={fields} name="confirmation" id="signup-confirmation" />
          {error && <p role="alert">{error}</p>}
          <button className="button" type="submit" disabled={busy}>{busy ? 'Creando…' : 'Crear cuenta de Cliente'}</button>
          <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>.</p>
        </form>
      )}
    </section>
  );
}
