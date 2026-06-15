import multer from "multer";

const imageFileFilter = (_req, file, cb) => {
  if (!file?.mimetype?.startsWith("image/")) {
    const error = new Error("Only image uploads are allowed.");
    error.statusCode = 400;
    cb(error);
    return;
  }
  cb(null, true);
};

export const blogImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024,
    files: 1,
  },
});
