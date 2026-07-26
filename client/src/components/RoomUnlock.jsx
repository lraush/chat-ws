import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import styles from "../styles/Main.module.css";
import { getBackendConfigMessage, isBackendConfigured } from "../utils/backend";
import { saveRoomSecretNumber } from "../utils/api";
import { normalizeRotations } from "../utils/cipher";
import { getUserName, isAuthenticated } from "../utils/auth";
import { clearRoomCipherRotations, setRoomCipherRotations } from "../utils/roomCipher";
import { normalizeRoomId } from "../utils/room";

const RoomUnlock = () => {
  const navigate = useNavigate();
  const { roomId: rawRoomId } = useParams();
  const roomId = normalizeRoomId(rawRoomId);

  const [rotationsInput, setRotationsInput] = useState("3");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (roomId) {
      clearRoomCipherRotations(roomId);
    }
  }, [roomId]);

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

  if (!roomId) {
    return (
      <div className={styles.wrap}>
        <div className={`${styles.container} ${styles.centered}`}>
          <p className={styles.error}>Invalid room.</p>
          <Link to="/lobby" className={styles.linkButton}>
            Back to lobby
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (String(rotationsInput).trim() === "") {
      setError("Enter a number from 0 upward.");
      return;
    }
    if (!isBackendConfigured()) {
      setError(getBackendConfigMessage());
      return;
    }
    const rotations = normalizeRotations(rotationsInput);
    setError("");
    setSaving(true);
    try {
      await saveRoomSecretNumber(roomId, rotations);
      setRoomCipherRotations(roomId, rotations);
      navigate(`/chat/${roomId}`, { replace: true });
    } catch (err) {
      setError(
        err?.message === "network"
          ? "Cannot reach the server."
          : "Could not save secret number.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={`${styles.container} ${styles.centered} ${styles.flatCorners}`}>
        <h1 className={styles.heading}>Secret chat</h1>
        <p className={styles.hint}>
          Signed in as {getUserName()}.
        </p>
        <p className={styles.hint}>
          Введите одно и то же любимое число, что и собеседники — от него
          зависит шифровка букв в комнате. Цифры и эмодзи не меняются.
        </p>
        <p className={styles.hint}>
          Room: <code className={styles.roomCode}>{roomId}</code>
        </p>

        {error ? <p className={styles.error}>{error}</p> : null}

        <form className={`${styles.form} ${styles.flatCorners}`} onSubmit={handleSubmit}>
          <label className={styles.group}>
            <span className={styles.label}>Любимое число</span>
            <input
              type="number"
              min={0}
              max={9999}
              step={1}
              className={styles.input}
              value={rotationsInput}
              inputMode="numeric"
              onChange={(e) => setRotationsInput(e.target.value)}
            />
          </label>
          <button type="submit" className={styles.button} disabled={saving}>
            {saving ? "Saving…" : "Enter chat"}
          </button>
        </form>

        <Link to="/lobby" className={styles.textButton}>
          Cancel
        </Link>
      </div>
    </div>
  );
};

export default RoomUnlock;
