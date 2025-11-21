import { Media } from "../db/connection.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getMedia = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const media = await Media.findByPk(id);

  if (!media || !media.data) {
    return res.status(404).send("Media not found");
  }

  res.set("Content-Type", media.mimetype);
  res.send(media.data);
});
