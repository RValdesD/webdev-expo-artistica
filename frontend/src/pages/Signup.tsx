import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import authService, { apiError } from "../services/auth";
import "../styles/auth.css";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await authService.signup({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setPassword("");
      setConfirmation("");
      setCreated(true);
    } catch (reason: unknown) {
      setError(apiError(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page">
      <p className="eyebrow">EXPO / CLIENTES</p>
      <h1>Crear cuenta</h1>
      {created ? (
        <div role="status">
          <p>Tu cuenta está creada.</p>
          <Link className="button" to="/login">
            Iniciar sesión
          </Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="signup-name">Nombre</label>
          <input
            id="signup-name"
            autoComplete="name"
            required
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={busy}
          />
          <label htmlFor="signup-email">Correo</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy}
          />
          <label htmlFor="signup-password">Contraseña</label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={15}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={busy}
            aria-describedby="password-help"
          />
          <small id="password-help">
            Entre 15 y 128 caracteres. Puedes usar una frase larga.
          </small>
          <label htmlFor="signup-confirmation">Repite la contraseña</label>
          <input
            id="signup-confirmation"
            type="password"
            autoComplete="new-password"
            required
            minLength={15}
            maxLength={128}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            disabled={busy}
          />
          {error && <p role="alert">{error}</p>}
          <button className="button" type="submit" disabled={busy}>
            {busy ? "Creando…" : "Crear cuenta de Cliente"}
          </button>
          <p>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>.
          </p>
        </form>
      )}
    </section>
  );
}
