import io from "socket.io-client";
import { getBackendUrl } from "./backend";

const transports = ["websocket", "polling"];

export const socket = io(getBackendUrl(), {
  transports,
  autoConnect: true,
});

export function joinChat(sock, { name, room }, onResult) {
  emitJoin(sock, { name, room })
    .then((response) => onResult?.(response))
    .catch((err) => {
      onResult?.({
        error: err?.message === "not connected" ? "no connection" : err?.message,
      });
    });
}

export function emitJoin(sock, { name, room }) {
  const payload = { name: String(name).trim(), room: String(room).trim() };

  return new Promise((resolve, reject) => {
    if (!payload.name || !payload.room) {
      reject(new Error("name and room are required"));
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
