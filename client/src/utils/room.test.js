import {
  normalizeRoomId,
  buildInviteUrl,
  parseRoomIdFromInvite,
} from "./room";

describe("room utils", () => {
  const origin = "http://localhost:3000";

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      value: { origin },
      writable: true,
    });
  });

  test("normalizeRoomId trims and decodes", () => {
    expect(normalizeRoomId("  room-1  ")).toBe("room-1");
    expect(normalizeRoomId("room%201")).toBe("room 1");
    expect(normalizeRoomId("")).toBe("");
  });

  test("buildInviteUrl uses current origin", () => {
    expect(buildInviteUrl("abc")).toBe(`${origin}/join/abc`);
    expect(buildInviteUrl("")).toBe("");
  });

  test("parseRoomIdFromInvite accepts raw id", () => {
    expect(parseRoomIdFromInvite("room-42")).toBe("room-42");
  });

  test("parseRoomIdFromInvite extracts id from path", () => {
    expect(parseRoomIdFromInvite("/join/my-room")).toBe("my-room");
  });

  test("parseRoomIdFromInvite extracts id from full url", () => {
    expect(parseRoomIdFromInvite(`${origin}/join/secret-room`)).toBe(
      "secret-room",
    );
  });
});
