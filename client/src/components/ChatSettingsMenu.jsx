import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/Main.module.css";

/**
 * @param {{
 *   roomId: string;
 *   cipherRotations: number | null | undefined;
 *   spellCheckEnabled: boolean;
 *   onToggleSpellCheck: () => void;
 *   spellCheckHint: string;
 *   soundEnabled: boolean;
 *   onToggleSound: () => void;
 * }} props
 */
const ChatSettingsMenu = ({
  roomId,
  cipherRotations,
  spellCheckEnabled,
  onToggleSpellCheck,
  spellCheckHint,
  soundEnabled,
  onToggleSound,
}) => {
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

  return (
    <div className={styles.chatSettingsRoot} ref={rootRef}>
      <button
        type="button"
        className={styles.chatSettingsButton}
        aria-label="Настройки чата"
        aria-expanded={open}
        aria-haspopup="true"
        title="Настройки чата"
        onClick={() => setOpen((value) => !value)}
      >
        ⚙
      </button>

      {open ? (
        <div className={`${styles.burgerPanel} ${styles.chatSettingsPanel}`} role="menu">
          <p className={styles.burgerMeta}>Настройки чата</p>
          <Link
            to={`/unlock/${roomId}`}
            className={styles.burgerItem}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {cipherRotations && cipherRotations > 0
              ? "🔐 Любимое число"
              : "🔓 Любимое число"}
          </Link>
          <button
            type="button"
            className={`${styles.burgerItem} ${styles.burgerItemButton} ${styles.burgerItemToggle}`}
            role="menuitemcheckbox"
            aria-checked={spellCheckEnabled}
            title={spellCheckHint}
            onClick={onToggleSpellCheck}
          >
            Орфография и пунктуация:{" "}
            {spellCheckEnabled ? "Вкл" : "Выкл"}
          </button>
          <button
            type="button"
            className={`${styles.burgerItem} ${styles.burgerItemButton} ${styles.burgerItemToggle}`}
            role="menuitemcheckbox"
            aria-checked={soundEnabled}
            onClick={onToggleSound}
          >
            Звук сообщений: {soundEnabled ? "Вкл" : "Выкл"}
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default ChatSettingsMenu;
