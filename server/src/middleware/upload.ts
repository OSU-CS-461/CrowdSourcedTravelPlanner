import multer from "multer";
import { MAX_MEDIA_FILES, MAX_VIDEO_BYTES } from "../lib/mediaValidation";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    // Multer supports one global file limit. Per-type validation is enforced later.
    fileSize: MAX_VIDEO_BYTES,
    files: MAX_MEDIA_FILES,
  },
});
