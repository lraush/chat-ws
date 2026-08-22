import {
  getRoomCipherRotations,
  setRoomCipherRotations,
  clearRoomCipherRotations,
  hasRoomCipherConfigured,
} from "./roomCipher";

describe("roomCipher", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test("returns null when cipher is not configured", () => {
    expect(getRoomCipherRotations("room-1")).toBe(null);
    expect(hasRoomCipherConfigured("room-1")).toBe(false);
  });

  test("persists rotations per room in sessionStorage", () => {
    setRoomCipherRotations("room-1", 42);
    expect(getRoomCipherRotations("room-1")).toBe(42);
    expect(hasRoomCipherConfigured("room-1")).toBe(true);

    setRoomCipherRotations("room-2", 7);
    expect(getRoomCipherRotations("room-2")).toBe(7);
    expect(getRoomCipherRotations("room-1")).toBe(42);
  });

  test("clearRoomCipherRotations removes stored value", () => {
    setRoomCipherRotations("room-1", 10);
    clearRoomCipherRotations("room-1");
    expect(getRoomCipherRotations("room-1")).toBe(null);
  });

  test("clamps rotations on save", () => {
    setRoomCipherRotations("room-1", 50000);
    expect(getRoomCipherRotations("room-1")).toBe(9999);
  });
});
