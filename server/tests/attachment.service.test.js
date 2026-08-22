const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const {
  sanitizeFileName,
  detectMessageKind,
  validateUploadFile,
  isBlockedExtension,
} = require("../services/attachment.service");

describe("attachment.service", () => {
  test("sanitizeFileName keeps basename and trims unsafe chars", () => {
    assert.equal(sanitizeFileName("../../photo.jpg"), "photo.jpg");
    assert.equal(sanitizeFileName("отчёт 2026.pdf"), "отчёт 2026.pdf");
  });

  test("detectMessageKind distinguishes image and file", () => {
    assert.equal(detectMessageKind("image/png"), "IMAGE");
    assert.equal(detectMessageKind("application/pdf"), "FILE");
  });

  test("isBlockedExtension rejects executables", () => {
    assert.equal(isBlockedExtension("virus.exe"), true);
    assert.equal(isBlockedExtension("photo.jpg"), false);
  });

  test("validateUploadFile accepts png image", () => {
    const result = validateUploadFile({
      originalname: "shot.png",
      mimetype: "image/png",
      size: 1024,
      buffer: Buffer.from("abc"),
    });
    assert.equal(result.error, undefined);
    assert.equal(result.kind, "IMAGE");
    assert.equal(result.safeName, "shot.png");
  });

  test("validateUploadFile rejects oversize file", () => {
    const result = validateUploadFile({
      originalname: "big.zip",
      mimetype: "application/zip",
      size: 20 * 1024 * 1024,
      buffer: Buffer.alloc(1),
    });
    assert.equal(result.error, "file_too_large");
  });

  test("validateUploadFile rejects blocked extension", () => {
    const result = validateUploadFile({
      originalname: "run.exe",
      mimetype: "application/octet-stream",
      size: 100,
      buffer: Buffer.from("abc"),
    });
    assert.equal(result.error, "file_type_not_allowed");
  });
});
