import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../styles/Main.module.css";
import {
  clearAuthSession,
  getAuthUser,
  isAdmin,
} from "../utils/auth";
import { disconnectSocket } from "../utils/socket";

const LobbyMenu = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      setOpen(false);
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleSignOut = () => {
    setOpen(false);
    disconnectSocket();
    clearAuthSession();
    navigate("/", { replace: true });
  };

  const user = getAuthUser();
  const admin = isAdmin();

  return (
    <div className={styles.burgerRoot} ref={rootRef}>
      <button
        type="button"
        className={styles.burgerButton}
        aria-label="Menu"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.burgerBar} />
        <span className={styles.burgerBar} />
        <span className={styles.burgerBar} />
      </button>

      {open ? (
        <div className={styles.burgerPanel} role="menu">
          {user?.name ? (
            <p className={styles.burgerMeta}>{user.name}</p>
          ) : null}
          <Link
            to="/profile"
            className={styles.burgerItem}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          {admin ? (
            <Link
              to="/admin/users"
              className={styles.burgerItem}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Admin panel
            </Link>
          ) : null}
          <button
            type="button"
            className={`${styles.burgerItem} ${styles.burgerItemButton}`}
            role="menuitem"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default LobbyMenu;
