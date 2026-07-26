import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import styles from "../styles/Main.module.css";
import { getBackendConfigMessage } from "../utils/backend";
import { decryptMessage, encryptMessage } from "../utils/cipher";
import { getUserName, isAuthenticated } from "../utils/auth";
import {
  getRoomCipherRotations,
  hasRoomCipherConfigured,
} from "../utils/roomCipher";
import { normalizeRoomId } from "../utils/room";
import {
  isMessageSoundEnabled,
  playIncomingMessageSound,
  primeMessageSound,
  setMessageSoundEnabled,
} from "../utils/messageSound";

const ChatEmojiPicker = lazy(() => import("./ChatEmojiPicker"));

const Chat = () => {
  const navigate = useNavigate();
  const { roomId: rawRoomId } = useParams();
  const roomId = normalizeRoomId(rawRoomId);
  const [userName] = useState(() => getUserName());
  const [cipherRotations] = useState(() => getRoomCipherRotations(roomId));

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => isMessageSoundEnabled());
  const joinedRef = useRef(false);
  const composeRef = useRef(null);
  const socketRef = useRef(null);
  const socketApiRef = useRef(null);

  const loadSocketApi = useCallback(async () => {
    if (socketApiRef.current) return socketApiRef.current;
    const mod = await import("../utils/socket");
    socketApiRef.current = mod;
    socketRef.current = mod.getSocket();
    return mod;
  }, []);

  const performJoin = useCallback(async () => {
    if (!roomId) return false;

    setConnecting(true);
    setError("");

    try {
      const mod = await loadSocketApi();
      const sock = mod.getSocket();
      socketRef.current = sock;
      const response = await mod.emitJoin(sock, { room: roomId });
      setMessages(response?.messages ?? []);
      joinedRef.current = true;
      return true;
    } catch (err) {
      joinedRef.current = false;
      if (err?.message === "config") {
        setError(getBackendConfigMessage());
      } else {
        setError(err?.message || "Could not join room");
      }
      return false;
    } finally {
      setConnecting(false);
    }
  }, [roomId, loadSocketApi]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/", { replace: true });
      return;
    }

    if (!roomId) {
      navigate("/lobby", { replace: true });
      return;
    }

    if (!hasRoomCipherConfigured(roomId)) {
      navigate(`/unlock/${roomId}`, { replace: true });
    }
  }, [userName, roomId, navigate]);

  useEffect(() => {
    if (!roomId || !isAuthenticated() || !hasRoomCipherConfigured(roomId)) {
      return;
    }

    let cancelled = false;
    let sock = null;
    let onNewMessage = null;
    let onReconnect = null;

    loadSocketApi().then((mod) => {
      if (cancelled) return;

      sock = mod.getSocket();
      socketRef.current = sock;

      if (!sock) {
        setError(getBackendConfigMessage());
        setConnecting(false);
        return;
      }

      onNewMessage = (newMessage) => {
        setMessages((prev) => mod.appendMessage(prev, newMessage));
        if (newMessage?.user?.name && newMessage.user.name !== userName) {
          playIncomingMessageSound();
        }
      };

      sock.on("message:new", onNewMessage);
      performJoin();

      onReconnect = () => {
        joinedRef.current = false;
        performJoin();
      };

      sock.io.on("reconnect", onReconnect);
    });

    return () => {
      cancelled = true;
      if (sock && onNewMessage) {
        sock.off("message:new", onNewMessage);
      }
      if (sock?.io && onReconnect) {
        sock.io.off("reconnect", onReconnect);
      }
    };
  }, [userName, roomId, navigate, performJoin, loadSocketApi]);

  useEffect(() => {
    const prime = () => primeMessageSound();
    window.addEventListener("pointerdown", prime, { once: true });
    window.addEventListener("keydown", prime, { once: true });
    return () => {
      window.removeEventListener("pointerdown", prime);
      window.removeEventListener("keydown", prime);
    };
  }, []);

  useEffect(() => {
    if (!showEmojiPicker) return;

    const onPointerDown = (event) => {
      if (composeRef.current?.contains(event.target)) return;
      setShowEmojiPicker(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showEmojiPicker]);

  const handleEmojiClick = ({ emoji }) => {
    setMessage((prev) => `${prev}${emoji}`);
    setShowEmojiPicker(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;

    const rotations = getRoomCipherRotations(roomId) ?? 0;
    const outbound = encryptMessage(text, rotations);

    if (!joinedRef.current) {
      const ok = await performJoin();
      if (!ok) return;
    }

    if (!socketRef.current) {
      setError(getBackendConfigMessage());
      return;
    }

    socketRef.current.timeout(10000).emit("sendMessage", { content: outbound }, (err, response) => {
      if (err) {
        setError("Message not sent (timeout)");
        return;
      }
      if (response?.error) {
        if (response.error === "join a room first") {
          joinedRef.current = false;
        }
        setError(response.error);
        return;
      }
      if (response?.message) {
        setMessages((prev) => {
          const mod = socketApiRef.current;
          if (mod) return mod.appendMessage(prev, response.message);
          return [...prev, response.message];
        });
      }
      setError("");
    });

    setMessage("");
  };

  const toggleSound = () => {
    primeMessageSound();
    const next = !soundEnabled;
    setMessageSoundEnabled(next);
    setSoundEnabled(next);
    if (next) {
      playIncomingMessageSound();
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={`${styles.container} ${styles.chatLayout}`}>
        <div className={styles.chatHeader}>
          <h2 className={styles.heading}>{userName}</h2>
          <div className={styles.chatHeaderActions}>
            <Link
              to={`/unlock/${roomId}`}
              className={styles.cipherBadge}
              title="Сменить любимое число"
              aria-label="Сменить любимое число"
            >
              {cipherRotations && cipherRotations > 0 ? "🔐" : "🔓"}
            </Link>
            <button
              type="button"
              className={styles.soundToggle}
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? "Mute message sounds" : "Enable message sounds"}
              title={soundEnabled ? "Sound on" : "Sound off"}
              onClick={toggleSound}
            >
              {soundEnabled ? "🔔" : "🔕"}
            </button>
            <Link to="/lobby" className={styles.textButton}>
              Leave
            </Link>
          </div>
        </div>

        {connecting ? (
          <p className={styles.hint}>Connecting to room…</p>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.messages}>
          {messages.length === 0 ? (
            <p className={styles.empty}>No messages yet. Say hello!</p>
          ) : (
            messages.map((mess) => {
              const isOwn = mess.user?.name === userName;

              return (
                <div
                  key={mess.id}
                  className={`${styles.messageRow} ${
                    isOwn ? styles.messageRowOut : styles.messageRowIn
                  }`}
                >
                  <div
                    className={`${styles.messageBubble} ${
                      isOwn ? styles.messageBubbleOut : styles.messageBubbleIn
                    }`}
                  >
                    {!isOwn ? (
                      <strong className={styles.messageAuthor}>
                        {mess.user?.name ?? "Unknown"}
                      </strong>
                    ) : null}
                    <p>{decryptMessage(mess.content, cipherRotations ?? 0)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={styles.compose} ref={composeRef}>
          {showEmojiPicker ? (
            <div className={styles.emojiPickerWrap}>
              <Suspense fallback={<p className={styles.hint}>Loading emoji…</p>}>
                <ChatEmojiPicker onEmojiClick={handleEmojiClick} />
              </Suspense>
            </div>
          ) : null}

          <form className={styles.composeForm} onSubmit={handleSend}>
            <button
              type="button"
              className={styles.emojiButton}
              disabled={connecting}
              aria-label="Add emoji"
              aria-expanded={showEmojiPicker}
              onClick={() => setShowEmojiPicker((open) => !open)}
            >
              😊
            </button>
            <input
              className={styles.input}
              value={message}
              placeholder={connecting ? "Connecting…" : "Message..."}
              autoComplete="off"
              disabled={connecting}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              className={styles.sendButton}
              type="submit"
              disabled={connecting || !message.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
