const multer = require("multer");
const { MAX_FILE_SIZE } = require("../services/attachment.service");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

function uploadSingleAttachment(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "file_too_large" });
      return;
    }

    res.status(400).json({ error: "invalid_upload" });
  });
}

module.exports = {
  uploadSingleAttachment,
};
