import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "../styles/Main.module.css";
import { getBackendConfigMessage } from "../utils/backend";
import { checkMessageSpelling, getProofreaderAvailability, isProofreaderUsable } from "../utils/messageSpellCheck";
import { destroyProofreaderSession } from "../utils/proofreader";
import { resolveCorrectedInput, truncatePreview } from "../utils/spellMatches";
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
import {
  getSpellLanguage,
  isSpellCheckEnabled,
  setSpellCheckEnabled,
  shouldRunSpellCheck,
} from "../utils/spellCheckPrefs";
import LobbyMenu from "./LobbyMenu";
import ChatSettingsMenu from "./ChatSettingsMenu";

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
  const [spellCheckEnabled, setSpellCheckEnabledState] = useState(() =>
    isSpellCheckEnabled(),
  );
  const [spellReview, setSpellReview] = useState(null);
  const [spellLive, setSpellLive] = useState(null);
  const [spellLivePending, setSpellLivePending] = useState(false);
  const [spellChecking, setSpellChecking] = useState(false);
  const [proofreaderStatus, setProofreaderStatus] = useState("unsupported");
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

  useEffect(() => {
    let cancelled = false;
    getProofreaderAvailability().then((status) => {
      if (!cancelled) setProofreaderStatus(status);
    });
    return () => {
      cancelled = true;
      destroyProofreaderSession();
    };
  }, []);

  const trimmedMessage = message.trim();

  useEffect(() => {
    if (!spellCheckEnabled) {
      setSpellLive(null);
      setSpellLivePending(false);
      return;
    }

    if (!trimmedMessage || trimmedMessage.length < 4 || !shouldRunSpellCheck(trimmedMessage)) {
      setSpellLive(null);
      setSpellLivePending(false);
      return;
    }

    if (spellReview?.text === trimmedMessage) {
      return;
    }

    let cancelled = false;
    setSpellLivePending(true);

    const timer = setTimeout(async () => {
      try {
        const result = await checkMessageSpelling(trimmedMessage, getSpellLanguage());
        if (cancelled) return;
        if (result.matches?.length) {
          setSpellLive({ ...result, text: trimmedMessage });
        } else {
          setSpellLive(null);
        }
      } catch {
        if (!cancelled) setSpellLive(null);
      } finally {
        if (!cancelled) setSpellLivePending(false);
      }
    }, 650);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmedMessage, spellCheckEnabled, spellReview?.text]);

  const proofreaderActive = isProofreaderUsable(proofreaderStatus);

  const activeSpell =
    spellReview?.text === trimmedMessage
      ? spellReview
      : spellLive?.text === trimmedMessage && spellLive.matches?.length
        ? spellLive
        : null;

  const handleEmojiClick = ({ emoji }) => {
    setMessage((prev) => `${prev}${emoji}`);
    setShowEmojiPicker(false);
  };

  const sendMessageNow = useCallback(
    (text) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const rotations = getRoomCipherRotations(roomId) ?? 0;
      const outbound = encryptMessage(trimmed, rotations);

      const emitMessage = () => {
        if (!socketRef.current) {
          setError(getBackendConfigMessage());
          return;
        }

        socketRef.current
          .timeout(10000)
          .emit("sendMessage", { content: outbound }, (err, response) => {
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
        setSpellReview(null);
        setSpellLive(null);
      };

      (async () => {
        if (!joinedRef.current) {
          const ok = await performJoin();
          if (!ok) return;
        }
        emitMessage();
      })();
    },
    [performJoin, roomId],
  );

  const suggestedText = activeSpell
    ? resolveCorrectedInput(activeSpell.text ?? trimmedMessage, activeSpell)
    : "";
  const showAllFixes =
    activeSpell?.matches?.length &&
    suggestedText &&
    suggestedText !== (activeSpell.text ?? trimmedMessage);

  const applyCorrectedInput = () => {
    if (!showAllFixes) return;
    setMessage(suggestedText);
    setSpellReview(null);
    setSpellLive(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || spellChecking) return;

    if (spellCheckEnabled && shouldRunSpellCheck(text)) {
      setSpellChecking(true);
      setError("");
      try {
        let result;
        if (spellLive?.text === text && spellLive.matches?.length) {
          result = spellLive;
        } else {
          result = await checkMessageSpelling(text, getSpellLanguage());
        }
        if (result.matches?.length) {
          setSpellReview({
            text,
            matches: result.matches,
            correctedInput: result.correctedInput,
            source: result.source,
          });
          return;
        }
        setSpellReview(null);
      } catch (err) {
        if (err?.message === "rate_limit") {
          setError("Spell check limit reached. Try again later or turn checking off.");
        } else if (err?.message === "network") {
          setError("Cannot reach the server for spell check.");
        } else if (proofreaderActive) {
          setError("Proofreader check failed.");
        } else {
          setError("Spell check unavailable.");
        }
        return;
      } finally {
        setSpellChecking(false);
      }
    }

    sendMessageNow(text);
  };

  const handleSendAnyway = () => {
    const text = spellReview?.text ?? activeSpell?.text ?? trimmedMessage;
    if (!text) return;
    setSpellReview(null);
    setSpellLive(null);
    sendMessageNow(text);
  };

  const toggleSpellCheck = () => {
    const next = !spellCheckEnabled;
    setSpellCheckEnabled(next);
    setSpellCheckEnabledState(next);
    setSpellReview(null);
    setSpellLive(null);
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
      <header className={`${styles.lobbyHeader} ${styles.lobbyHeaderChat}`}>
        <ChatSettingsMenu
          roomId={roomId}
          cipherRotations={cipherRotations}
          spellCheckEnabled={spellCheckEnabled}
          onToggleSpellCheck={toggleSpellCheck}
          spellCheckHint={
            spellCheckEnabled
              ? proofreaderActive
                ? "Проверка: вкл (Edge Proofreader на устройстве)"
                : proofreaderStatus === "downloading"
                  ? "Proofreader: загрузка модели…"
                  : "Проверка: вкл (LanguageTool)"
              : "Проверка орфографии и пунктуации: выкл"
          }
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />
        <LobbyMenu />
      </header>
      <div className={`${styles.container} ${styles.chatLayout}`}>
        <div className={styles.chatHeader}>
          <h2 className={styles.heading}>{userName}</h2>
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

          {(activeSpell || (spellCheckEnabled && spellLivePending && trimmedMessage.length >= 4)) ? (
            <div className={styles.spellBar} role="status" aria-live="polite">
              <span className={styles.spellBarHint}>
                {spellLivePending && !activeSpell ? "…" : "All"}
              </span>
              {showAllFixes ? (
                <button
                  type="button"
                  className={styles.spellBarPreview}
                  title={suggestedText}
                  aria-label={`Apply all ${activeSpell.matches.length} corrections`}
                  onClick={applyCorrectedInput}
                >
                  {truncatePreview(suggestedText)}
                </button>
              ) : null}
              {spellReview ? (
                <div className={styles.spellBarActions}>
                  <button
                    type="button"
                    className={styles.spellBarSend}
                    onClick={handleSendAnyway}
                  >
                    Send anyway
                  </button>
                  <button
                    type="button"
                    className={styles.spellBarClose}
                    aria-label="Dismiss suggestions"
                    onClick={() => {
                      setSpellReview(null);
                      setSpellLive(null);
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.spellBarClose}
                  aria-label="Dismiss suggestions"
                  onClick={() => setSpellLive(null)}
                >
                  ×
                </button>
              )}
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
              placeholder={
                connecting
                  ? "Connecting…"
                  : spellChecking
                    ? proofreaderStatus === "downloading"
                      ? "Loading model…"
                      : "Checking…"
                    : "Message..."
              }
              autoComplete="off"
              spellCheck={spellCheckEnabled}
              lang={getSpellLanguage()}
              disabled={connecting || spellChecking}
              onChange={(e) => {
                setMessage(e.target.value);
                if (spellReview) setSpellReview(null);
              }}
            />
            <button
              className={styles.sendButton}
              type="submit"
              disabled={connecting || spellChecking || !message.trim()}
            >
              {spellChecking ? "…" : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
