const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { serializeMessage } = require("../services/message.services");

describe("message.services serializeMessage", () => {
  test("serializes text message with user", () => {
    const result = serializeMessage({
      id: "m1",
      content: "hello",
      kind: "TEXT",
      fileName: null,
      mimeType: null,
      fileSize: null,
      room: "room1",
      createdAt: new Date("2026-01-01T12:00:00.000Z"),
      user: { id: "u1", name: "Alice", email: "a@test.local" },
    });

    assert.equal(result.id, "m1");
    assert.equal(result.content, "hello");
    assert.equal(result.kind, "TEXT");
    assert.equal(result.hasAttachment, false);
    assert.deepEqual(result.user, {
      id: "u1",
      name: "Alice",
      email: "a@test.local",
    });
  });

  test("marks image and file messages as attachments", () => {
    const image = serializeMessage({
      id: "m2",
      content: "",
      kind: "IMAGE",
      fileName: "photo.png",
      mimeType: "image/png",
      fileSize: 1024,
      room: "room1",
      createdAt: new Date(),
      user: null,
    });
    assert.equal(image.hasAttachment, true);
    assert.equal(image.user, null);

    const file = serializeMessage({ id: "m3", kind: "FILE", room: "room1" });
    assert.equal(file.hasAttachment, true);
    assert.equal(file.content, "");
  });

  test("returns null for missing message", () => {
    assert.equal(serializeMessage(null), null);
  });
});
