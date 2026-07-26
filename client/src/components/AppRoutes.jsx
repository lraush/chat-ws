import React, { Suspense } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import Main from "./Main";
import { lazyWithRetry } from "../utils/lazyWithRetry";

const Lobby = lazyWithRetry(() => import("./Lobby"));
const Chat = lazyWithRetry(() => import("./Chat"));
const JoinRoom = lazyWithRetry(() => import("./JoinRoom"));
const RoomUnlock = lazyWithRetry(() => import("./RoomUnlock"));
const AdminAddUser = lazyWithRetry(() => import("./AdminAddUser"));
const Profile = lazyWithRetry(() => import("./Profile"));
const ChatLegacyRedirect = lazyWithRetry(() => import("./ChatLegacyRedirect"));

const JoinRoomRedirect = () => {
  const { roomId } = useParams();
  return <Navigate to={`/join/${roomId}`} replace />;
};

const RouteFallback = () => (
  <div className="routeFallback" role="status" aria-live="polite">
    Loading…
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/users" element={<AdminAddUser />} />
        <Route path="/join/:roomId" element={<JoinRoom />} />
        <Route path="/unlock/:roomId" element={<RoomUnlock />} />
        <Route path="/r/:roomId" element={<JoinRoomRedirect />} />
        <Route path="/chat/:roomId" element={<Chat />} />
        <Route path="/chat" element={<ChatLegacyRedirect />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
