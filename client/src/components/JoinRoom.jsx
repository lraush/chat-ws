import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import styles from "../styles/Main.module.css";
import { fetchRoom } from "../utils/api";
import { isAuthenticated } from "../utils/auth";
import { normalizeRoomId } from "../utils/room";

const JoinRoom = () => {
  const { roomId: rawRoomId } = useParams();
  const roomId = normalizeRoomId(rawRoomId);
  const navigate = useNavigate();
  const [roomStatus, setRoomStatus] = useState("loading");

  useEffect(() => {
    if (!roomId) {
      setRoomStatus("missing");
      return;
    }

    let cancelled = false;
    setRoomStatus("loading");

    fetchRoom(roomId)
      .then((room) => {
        if (cancelled) return;
        if (!room) {
          setRoomStatus("missing");
          return;
        }

        const name = isAuthenticated();
        if (name) {
          navigate(`/unlock/${roomId}`, { replace: true });
          return;
        }

        setRoomStatus("needLogin");
      })
      .catch(() => {
        if (!cancelled) {
          setRoomStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, navigate]);

  if (roomStatus === "loading") {
    return (
      <div className={styles.wrap}>
        <div className={`${styles.container} ${styles.centered}`}>
          <p className={styles.hint}>Opening invite…</p>
        </div>
      </div>
    );
  }

  if (roomStatus === "needLogin") {
    return (
      <NavigateToLogin roomId={roomId} />
    );
  }

  if (roomStatus === "missing") {
    return (
      <div className={styles.wrap}>
        <div className={`${styles.container} ${styles.centered}`}>
          <h1 className={styles.heading}>Room not found</h1>
          <p className={styles.hint}>
            This invite link is invalid or expired.
          </p>
          <Link to="/" className={styles.linkButton}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (roomStatus === "error") {
    return (
      <div className={styles.wrap}>
        <div className={`${styles.container} ${styles.centered}`}>
          <p className={styles.error}>Could not open invite. Try again later.</p>
          <Link to="/" className={styles.linkButton}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return null;
};

function NavigateToLogin({ roomId }) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/?redirect=${encodeURIComponent(`/join/${roomId}`)}`, {
      replace: true,
    });
  }, [navigate, roomId]);

  return (
    <div className={styles.wrap}>
      <div className={`${styles.container} ${styles.centered}`}>
        <p className={styles.hint}>Sign in to join the room…</p>
      </div>
    </div>
  );
}

export default JoinRoom;
