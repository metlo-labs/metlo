import Multer from "multer";

export const MulterSource = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    // limit 1mb
    fileSize: 500 * 1024 * 1024,
  },
});
