import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "../styles/Main.module.css";
import { login } from "../utils/api";
import { getBackendConfigMessage, isBackendConfigured } from "../utils/backend";
import { isAuthenticated } from "../utils/auth";

const Main = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated() && !redirect) {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, redirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError("");

    if (!isBackendConfigured()) {
      setError(getBackendConfigMessage());
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      if (redirect.startsWith("/")) {
        navigate(redirect, { replace: true });
        return;
      }
      navigate("/lobby", { replace: true });
    } catch (err) {
      if (err?.message === "invalid_credentials") {
        setError("Неверный email или пароль.");
      } else if (err?.message === "network") {
        setError("Cannot reach the server.");
      } else {
        setError("Could not sign in.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={`${styles.container} ${styles.centered}`}>
        <h1 className={styles.heading}>Sign in</h1>
        <p className={styles.hint}>Email and password from your account.</p>

        {error ? <p className={styles.error}>{error}</p> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.group}>
            <input
              type="email"
              name="email"
              value={email}
              placeholder="Email"
              className={styles.input}
              autoComplete="email"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.group}>
            <input
              type="password"
              name="password"
              value={password}
              placeholder="Password"
              className={styles.input}
              autoComplete="current-password"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className={styles.button} disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Main;
