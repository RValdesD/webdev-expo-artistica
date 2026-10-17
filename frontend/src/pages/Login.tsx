import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiError } from "../services/auth";
import "../styles/auth.css";

export default function Login() {
  const { client, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await login({ email: email.trim(), password });
      setPassword("");
      navigate("/workshops");
    } catch (reason: unknown) {
      setError(apiError(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page">
      <p className="eyebrow">EXPO / CLIENTES</p>
      <h1>Iniciar sesión</h1>
      {client ? (
        <p>
          Sesión iniciada como {client.name}.{" "}
          <Link to="/workshops">Ver talleres</Link>.
        </p>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Correo</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy}
          />
          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={busy}
          />
          {error && <p role="alert">{error}</p>}
          <button className="button" type="submit" disabled={busy}>
            {busy ? "Ingresando…" : "Iniciar sesión"}
          </button>
          <p>
            ¿Primera visita? <Link to="/signup">Crea tu cuenta</Link>.
          </p>
        </form>
      )}
    </section>
  );
}
