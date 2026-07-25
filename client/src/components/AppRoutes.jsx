import React from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import Main from "./Main";
import Lobby from "./Lobby";
import Chat from "./Chat";
import JoinRoom from "./JoinRoom";
import ChatLegacyRedirect from "./ChatLegacyRedirect";

const JoinRoomRedirect = () => {
  const { roomId } = useParams();
  return <Navigate to={`/join/${roomId}`} replace />;
};

const AppRoutes = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/join/:roomId" element={<JoinRoom />} />
        <Route path="/r/:roomId" element={<JoinRoomRedirect />} />
        <Route path="/chat/:roomId" element={<Chat />} />
        <Route path="/chat" element={<ChatLegacyRedirect />} />
      </Routes>
    </div>
  );
};

export default AppRoutes;
