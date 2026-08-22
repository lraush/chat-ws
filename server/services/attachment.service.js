const path = require("node:path");
const fs = require("node:fs");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const MAX_FILE_SIZE = 15 * 1024 * 1024;

const BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".msi",
  ".scr",
  ".sh",
  ".bash",
  ".ps1",
  ".js",
  ".mjs",
  ".cjs",
  ".jar",
  ".app",
  ".dmg",
  ".php",
  ".html",
  ".htm",
]);

const ALLOWED_MIME_PREFIXES = ["image/"];

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function sanitizeFileName(name) {
  const base = path.basename(String(name ?? "file")).replace(/[^\w.\- ()[\]а-яА-ЯёЁ]/g, "_");
  return base.slice(0, 200) || "file";
}

function getFileExtension(fileName) {
  const ext = path.extname(String(fileName ?? "")).toLowerCase();
  return ext;
}

function isBlockedExtension(fileName) {
  return BLOCKED_EXTENSIONS.has(getFileExtension(fileName));
}

function detectMessageKind(mimeType) {
  const mime = String(mimeType ?? "").toLowerCase();
  if (mime.startsWith("image/")) {
    return "IMAGE";
  }
  return "FILE";
}

function validateUploadFile(file) {
  if (!file) {
    return { error: "file_required" };
  }

  if (!file.buffer?.length) {
    return { error: "file_empty" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "file_too_large" };
  }

  const safeName = sanitizeFileName(file.originalname);
  if (isBlockedExtension(safeName)) {
    return { error: "file_type_not_allowed" };
  }

  const mime = String(file.mimetype ?? "").toLowerCase();
  const kind = detectMessageKind(mime);

  if (kind === "IMAGE") {
    if (!ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix))) {
      return { error: "file_type_not_allowed" };
    }
  } else if (!ALLOWED_MIME_TYPES.has(mime)) {
    return { error: "file_type_not_allowed" };
  }

  return {
    kind,
    safeName,
    mimeType: mime,
    fileSize: file.size,
  };
}

function getStoredFilePath(storedName) {
  const safe = path.basename(String(storedName ?? ""));
  return path.join(UPLOAD_DIR, safe);
}

function writeUploadedFile(storedName, buffer) {
  ensureUploadDir();
  const target = getStoredFilePath(storedName);
  fs.writeFileSync(target, buffer);
  return target;
}

function readUploadedFile(storedName) {
  const target = getStoredFilePath(storedName);
  if (!fs.existsSync(target)) {
    return null;
  }
  return fs.readFileSync(target);
}

module.exports = {
  UPLOAD_DIR,
  MAX_FILE_SIZE,
  ensureUploadDir,
  sanitizeFileName,
  detectMessageKind,
  validateUploadFile,
  getStoredFilePath,
  writeUploadedFile,
  readUploadedFile,
  isBlockedExtension,
};
