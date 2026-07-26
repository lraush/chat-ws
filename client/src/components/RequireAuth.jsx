import { Link } from "react-router-dom";
import styles from "../styles/Main.module.css";
import { isAuthenticated } from "../utils/auth";

const RequireAuth = ({ children }) => {
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

  return children;
};

export default RequireAuth;
