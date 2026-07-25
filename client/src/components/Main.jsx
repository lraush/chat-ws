import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "../styles/Main.module.css";
import { getUserName, setUserName } from "../utils/auth";

const Main = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "";

  const [name, setName] = useState(() => getUserName());

  useEffect(() => {
    const saved = getUserName();
    if (saved && !redirect) {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, redirect]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setUserName(trimmed);

    if (redirect.startsWith("/")) {
      navigate(redirect, { replace: true });
      return;
    }

    navigate("/lobby", { replace: true });
  };

  return (
    <div className={styles.wrap}>
      <div className={`${styles.container} ${styles.centered}`}>
        <h1 className={styles.heading}>Sign in</h1>
        <p className={styles.hint}>Enter your name to continue.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.group}>
            <input
              type="text"
              name="name"
              value={name}
              placeholder="Your name"
              className={styles.input}
              autoComplete="nickname"
              required
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <button type="submit" className={styles.button}>
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default Main;
