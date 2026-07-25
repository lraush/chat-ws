import { useLayoutEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { setUserName } from "../utils/auth";

const ChatLegacyRedirect = () => {
  const { search } = useLocation();
  const params = Object.fromEntries(new URLSearchParams(search));
  const { name, room } = params;

  useLayoutEffect(() => {
    if (name?.trim()) {
      setUserName(name.trim());
    }
  }, [name]);

  if (!room) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/chat/${room}`} replace />;
};

export default ChatLegacyRedirect;
