import { Link } from "react-router-dom";
import styles from "../styles/Main.module.css";
import LobbyMenu from "./LobbyMenu";
import { getAuthUser, isAdmin, isAuthenticated } from "../utils/auth";

const Profile = () => {
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

  const user = getAuthUser();

  return (
    <div className={styles.wrap}>
      <header className={styles.lobbyHeader}>
        <LobbyMenu />
      </header>
      <div className={`${styles.container} ${styles.centered} ${styles.flatCorners}`}>
        <h1 className={styles.heading}>Profile</h1>

        <dl className={styles.profileList}>
          <div className={styles.profileRow}>
            <dt className={styles.profileLabel}>Name</dt>
            <dd className={styles.profileValue}>{user?.name ?? "—"}</dd>
          </div>
          <div className={styles.profileRow}>
            <dt className={styles.profileLabel}>Email</dt>
            <dd className={styles.profileValue}>{user?.email ?? "—"}</dd>
          </div>
          <div className={styles.profileRow}>
            <dt className={styles.profileLabel}>Role</dt>
            <dd className={styles.profileValue}>
              {isAdmin() ? "Administrator" : "User"}
            </dd>
          </div>
        </dl>

        <Link to="/lobby" className={styles.linkButton}>
          Back to lobby
        </Link>
      </div>
    </div>
  );
};

export default Profile;
