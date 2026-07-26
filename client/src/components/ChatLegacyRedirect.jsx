import { Navigate, useLocation } from "react-router-dom";

const ChatLegacyRedirect = () => {
  const { search } = useLocation();
  const params = Object.fromEntries(new URLSearchParams(search));
  const { room } = params;

  if (!room) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/unlock/${room}`} replace />;
};

export default ChatLegacyRedirect;
