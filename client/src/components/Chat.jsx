import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EmojiPicker, { Theme } from "emoji-picker-react";
import styles from "../styles/Main.module.css";
import { appendMessage, emitJoin, socket } from "../utils/socket";
import { getUserName } from "../utils/auth";
import { normalizeRoomId } from "../utils/room";
import {
  isMessageSoundEnabled,
  playIncomingMessageSound,
  primeMessageSound,
  setMessageSoundEnabled,
} from "../utils/messageSound";

const Chat = () => {
  const navigate = useNavigate();
  const { roomId: rawRoomId } = useParams();
  const roomId = normalizeRoomId(rawRoomId);
  const [userName] = useState(() => getUserName());

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => isMessageSoundEnabled());
  const joinedRef = useRef(false);
  const composeRef = useRef(null);

  const performJoin = useCallback(async () => {
    if (!userName || !roomId) return false;

    setConnecting(true);
    setError("");

    try {
      const response = await emitJoin(socket, { name: userName, room: roomId });
      setMessages(response?.messages ?? []);
      setJoined(true);
      joinedRef.current = true;
      return true;
    } catch (err) {
      setJoined(false);
      joinedRef.current = false;
      setError(err?.message || "Could not join room");
      return false;
    } finally {
      setConnecting(false);
    }
  }, [userName, roomId]);

  useEffect(() => {
    if (!userName) {
      navigate("/", { replace: true });
      return;
    }

    if (!roomId) {
      navigate("/lobby", { replace: true });
      return;
    }

    const onNewMessage = (newMessage) => {
      setMessages((prev) => appendMessage(prev, newMessage));
      if (newMessage?.user?.name && newMessage.user.name !== userName) {
        playIncomingMessageSound();
      }
    };

    socket.on("message:new", onNewMessage);
    performJoin();

    const onReconnect = () => {
      joinedRef.current = false;
      setJoined(false);
      performJoin();
    };

    socket.io.on("reconnect", onReconnect);

    return () => {
      socket.off("message:new", onNewMessage);
      socket.io.off("reconnect", onReconnect);
    };
  }, [userName, roomId, navigate, performJoin]);

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

    if (!joinedRef.current) {
      const ok = await performJoin();
      if (!ok) return;
    }

    socket.timeout(10000).emit("sendMessage", { content: text }, (err, response) => {
      if (err) {
        setError("Message not sent (timeout)");
        return;
      }
      if (response?.error) {
        if (response.error === "join a room first") {
          joinedRef.current = false;
          setJoined(false);
        }
        setError(response.error);
        return;
      }
      if (response?.message) {
        setMessages((prev) => appendMessage(prev, response.message));
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
                    <p>{mess.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className={styles.compose} ref={composeRef}>
          {showEmojiPicker ? (
            <div className={styles.emojiPickerWrap}>
              <EmojiPicker
                theme={Theme.DARK}
                width="100%"
                height={220}
                searchPlaceholder="Search…"
                previewConfig={{ showPreview: false }}
                onEmojiClick={handleEmojiClick}
                style={{
                  "--epr-emoji-size": "22px",
                  "--epr-emoji-padding": "3px",
                  "--epr-horizontal-padding": "6px",
                  "--epr-header-padding": "6px 8px",
                  "--epr-category-label-height": "24px",
                }}
              />
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
