import io from "socket.io-client";
import { getBackendUrl } from "./backend";
import { getAuthToken } from "./auth";

const transports = ["websocket", "polling"];

let socketInstance = null;
let socketToken = null;

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    socketToken = null;
  }
}

export function getSocket() {
  const backendUrl = getBackendUrl();
  const token = getAuthToken();
  if (!backendUrl || !token) return null;

  if (socketInstance && socketToken !== token) {
    disconnectSocket();
  }

  if (!socketInstance) {
    socketToken = token;
    socketInstance = io(backendUrl, {
      transports,
      autoConnect: true,
      auth: { token },
    });
  }

  return socketInstance;
}

export function emitJoin(sock, { room }) {
  const payload = { room: String(room).trim() };

  return new Promise((resolve, reject) => {
    if (!sock) {
      reject(new Error("config"));
      return;
    }

    if (!payload.room) {
      reject(new Error("room is required"));
      return;
    }

    const emitJoinPacket = () => {
      if (!sock.connected) {
        reject(new Error("not connected"));
        return;
      }

      sock
        .timeout(15000)
        .emit("join", payload, (err, response) => {
          if (err) {
            reject(new Error("join timeout"));
            return;
          }
          if (response?.error) {
            reject(new Error(response.error));
            return;
          }
          resolve(response);
        });
    };

    if (sock.connected) {
      emitJoinPacket();
      return;
    }

    const onConnect = () => {
      sock.off("connect", onConnect);
      emitJoinPacket();
    };

    sock.on("connect", onConnect);
  });
}

export function appendMessage(list, message) {
  if (!message?.id) return list;
  if (list.some((item) => item.id === message.id)) return list;
  return [...list, message];
}
