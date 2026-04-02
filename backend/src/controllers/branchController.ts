import { Request, Response } from "express";
import { Chat } from "../models/Chat";

export const inheritContext = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // The current chat ID
    const { contextParentId } = req.body; // The parent chat ID to inherit from

    if (!req.user || !req.user._id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!id || !contextParentId) {
      res.status(400).json({ error: "Missing chat ID or parent ID" });
      return;
    }

    const updatedChat = await Chat.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: { contextParent: contextParentId } },
      { new: true }
    );

    if (!updatedChat) {
      res.status(404).json({ error: "Chat not found or unauthorized" });
      return;
    }

    res.status(200).json({ success: true, data: updatedChat });
  } catch (error: any) {
    console.error("Error inheriting context:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
