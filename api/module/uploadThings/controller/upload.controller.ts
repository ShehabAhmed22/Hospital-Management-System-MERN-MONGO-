import type { Request, Response } from "express";

import { UTApi } from "uploadthing/server";

export const utapi = new UTApi();

export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { fileUrl } = req.body;
    if (!fileUrl) {
      return res.status(400).json({ message: "File URL is required" });
    }
    const fileKey = fileUrl.split("/").pop();
    if (!fileKey) {
      return res.status(400).json({ message: "Invalid file URL" });
    }
    await utapi.deleteFiles(fileKey);
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
