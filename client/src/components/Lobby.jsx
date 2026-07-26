import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Main.module.css";
import { createRoom, fetchRoom } from "../utils/api";
import {
  getUserName,
} from "../utils/auth";
import { getBackendConfigMessage, isBackendConfigured } from "../utils/backend";
import { buildInviteUrl, parseRoomIdFromInvite } from "../utils/room";
import { clearRoomCipherRotations } from "../utils/roomCipher";
import LobbyMenu from "./LobbyMenu";
import RequireAuth from "./RequireAuth";

function lobbyErrorMessage(err, fallback) {
  if (err?.message === "config") return getBackendConfigMessage();
  if (err?.message === "network") return "Cannot reach the server.";
  if (err?.message === "unauthorized") return "Session expired. Sign in again.";
  return fallback;
}

const Lobby = () => {
  const navigate = useNavigate();
  const userName = getUserName();

  const [linkInput, setLinkInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [pendingRoomId, setPendingRoomId] = useState(null);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreateRoom = async () => {
    if (creating) return;
    if (!isBackendConfigured()) {
      setError(getBackendConfigMessage());
      return;
    }
    setCreating(true);
    setError("");
    setPendingRoomId(null);
    setInviteUrl("");

    try {
      const { id } = await createRoom();
      setPendingRoomId(id);
      setInviteUrl(buildInviteUrl(id));
    } catch (err) {
      setError(lobbyErrorMessage(err, "Could not create room."));
    } finally {
      setCreating(false);
    }
  };

  const handleEnterCreatedRoom = () => {
    if (!pendingRoomId) return;
    clearRoomCipherRotations(pendingRoomId);
    navigate(`/unlock/${pendingRoomId}`);
  };

  const handleCopyInvite = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy link");
    }
  };

  const handleJoinByLink = async (e) => {
    e.preventDefault();
    if (joining) return;

    const roomId = parseRoomIdFromInvite(linkInput);
    if (!roomId) {
      setError("Paste a valid invite link or room id.");
      return;
    }

    if (!isBackendConfigured()) {
      setError(getBackendConfigMessage());
      return;
    }

    setJoining(true);
    setError("");

    try {
      const room = await fetchRoom(roomId);
      if (!room) {
        setError("Room not found. Check the link.");
        return;
      }
      clearRoomCipherRotations(roomId);
      navigate(`/unlock/${roomId}`);
    } catch (err) {
      setError(lobbyErrorMessage(err, "Could not join room."));
    } finally {
      setJoining(false);
    }
  };

  return (
    <RequireAuth>
    <div className={styles.wrap}>
      <header className={styles.lobbyHeader}>
        <LobbyMenu />
      </header>
      <div className={`${styles.container} ${styles.centered}`}>
        <h1 className={styles.heading}>Hello, {userName}</h1>
        <p className={styles.hint}>Create a new room or join with an invite link.</p>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.lobbyActions}>
          <section className={styles.lobbyCard}>
            <h2 className={styles.lobbyTitle}>Create room</h2>
            <p className={styles.lobbyText}>
              Start a new chat and send the invite link to friends.
            </p>
            <button
              type="button"
              className={styles.button}
              disabled={creating}
              onClick={handleCreateRoom}
            >
              {creating ? "Creating…" : "Create room"}
            </button>

            {inviteUrl ? (
              <div className={styles.inviteBlock}>
                <p className={styles.lobbyText}>Invite link (share before you enter):</p>
                <div className={styles.share}>
                  <input
                    className={styles.shareInput}
                    readOnly
                    value={inviteUrl}
                    aria-label="Invite link"
                  />
                  <button
                    type="button"
                    className={styles.shareButton}
                    onClick={handleCopyInvite}
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.button}
                  onClick={handleEnterCreatedRoom}
                >
                  Enter chat
                </button>
              </div>
            ) : null}
          </section>

          <section className={styles.lobbyCard}>
            <h2 className={styles.lobbyTitle}>Join by link</h2>
            <p className={styles.lobbyText}>
              Paste the invite link you received.
            </p>
            <form className={styles.form} onSubmit={handleJoinByLink}>
              <input
                className={styles.input}
                value={linkInput}
                placeholder="https://…/join/… or room id"
                onChange={(e) => setLinkInput(e.target.value)}
              />
              <button
                type="submit"
                className={styles.button}
                disabled={joining}
              >
                {joining ? "Checking…" : "Join room"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
    </RequireAuth>
  );
};

export default Lobby;
