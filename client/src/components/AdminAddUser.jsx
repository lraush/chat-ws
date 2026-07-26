import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../styles/Main.module.css";
import { adminCreateUser } from "../utils/api";
import { isAdmin, isAuthenticated } from "../utils/auth";
import LobbyMenu from "./LobbyMenu";

const AdminAddUser = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated()) {
    return (
      <div className={styles.wrap}>
        <div className={`${styles.container} ${styles.centered}`}>
          <p className={styles.hint}>Please sign in first.</p>
          <Link to="/" className={styles.linkButton}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin()) {
    return (
      <div className={styles.wrap}>
        <header className={styles.lobbyHeader}>
          <LobbyMenu />
        </header>
        <div className={`${styles.container} ${styles.centered}`}>
          <p className={styles.error}>Admin access only.</p>
          <Link to="/lobby" className={styles.linkButton}>
            Back to lobby
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await adminCreateUser({
        email,
        password,
        name: name.trim() || undefined,
      });
      setSuccess("User created.");
      setEmail("");
      setPassword("");
      setName("");
    } catch (err) {
      if (err?.message === "email_taken") {
        setError("This email is already registered.");
      } else if (err?.message === "forbidden") {
        setError("Admin access only.");
      } else if (err?.message === "network") {
        setError("Cannot reach the server.");
      } else if (err?.message === "unauthorized") {
        navigate("/", { replace: true });
      } else {
        setError("Could not create user.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <header className={styles.lobbyHeader}>
        <LobbyMenu />
      </header>
      <div className={`${styles.container} ${styles.centered} ${styles.flatCorners}`}>
        <h1 className={styles.heading}>Add user</h1>
        <p className={styles.hint}>Create a chat account (email + password).</p>

        {error ? <p className={styles.error}>{error}</p> : null}
        {success ? <p className={styles.hint}>{success}</p> : null}

        <form className={`${styles.form} ${styles.flatCorners}`} onSubmit={handleSubmit}>
          <label className={styles.group}>
            <span className={styles.label}>Email</span>
            <input
              type="email"
              className={styles.input}
              value={email}
              required
              autoComplete="off"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className={styles.group}>
            <span className={styles.label}>Password</span>
            <input
              type="password"
              className={styles.input}
              value={password}
              required
              minLength={6}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className={styles.group}>
            <span className={styles.label}>Display name (optional)</span>
            <input
              type="text"
              className={styles.input}
              value={name}
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button type="submit" className={styles.button} disabled={submitting}>
            {submitting ? "Creating…" : "Create user"}
          </button>
        </form>

        <Link to="/lobby" className={styles.textButton}>
          Back to lobby
        </Link>
      </div>
    </div>
  );
};

export default AdminAddUser;
