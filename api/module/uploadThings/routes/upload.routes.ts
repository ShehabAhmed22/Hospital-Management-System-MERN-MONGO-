import { deleteFile } from "../controller/upload.controller";
import { requireAuth } from "../../../middlewares/auth.middleware";

import express from "express";

const uploadthingRouter = express.Router();

uploadthingRouter.delete("/", requireAuth, deleteFile);

export default uploadthingRouter;
