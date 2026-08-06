import { Router, type Request, type Response } from "express";
import { z } from "zod";
// import Zod validators
import {
  zUserId,
  zItemId,
  zItemPostBody,
  zItemPutBody,
  zItemDeleteBody,
} from "../libs/zodValidators.js";
// import types
import type { Item } from "../libs/types.ts";
// import database
import { items } from "../db/db.ts";
//import uuid
import { v4 as uuidv4 } from "uuid";
import { authenticateToken } from "../middlewares/authenMiddleware.ts";
import type { User, CustomRequest } from "../libs/types.js";
import { users } from "../db/db.ts";

const router = Router();

// GET /api/vXXX/items/:userId
router.get(
  "/items/:userId",
  authenticateToken,
  (req: CustomRequest, res: Response) => {
    try {
      const payload = req.user;
      const user = users.find((u) => u.username === payload?.username);
      const userId = req.params.userId;
      if (!user) {
        return res.status(401).json({
          ok: false,
          message: "Invalid username or password",
        });
      }

      if (userId != user?.userId) {
        return res.status(403).json({
          sucess: false,
          message: "Forbidden access",
        });
      }

      const finditem = items.filter((i) => i.userId === userId);
      const find = items.find((i) => i.userId === userId);

      if (!find) {
        return res.status(404).json({
          sucess: false,
          message: `item for user ID ${userId} not found`,
        });
      }

      return res.status(200).json({
        sucess: true,
        data: finditem,
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        message: "Something is wrong, please try again",
        error: err,
      });
    }
  },
);

// POST /api/vXXX/items/:userId, body = {new item data}
// add a new Item for userId
router.post("/items/:userId", async (req: Request, res: Response) => {
  res.status(201).json({
    success: true,
  });
});

const zEnrollmentReqBody = z.object({
  itemId: zItemId,
});
// Delete /api/vXXX/items/:userId
router.delete("/", authenticateToken, (req: CustomRequest, res: Response) => {
  try {
    const payload = req.user;
    const userId = req.params.userId;
    const user = users.find((u: User) => u.username === payload?.username);

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: "Invalid username or password",
      });
    }

    if (userId != user?.userId) {
      return res.status(403).json({
        sucess: false,
        message: "Forbidden access",
      });
    }

    const result = zEnrollmentReqBody.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        ok: false,
        message: "Validation failed",
        error: result.error.issues[0]?.message,
      });
    }

    const { itemId } = result.data;

    const itemindex = items.findIndex((e) => e.itemId === itemId);

    if (itemindex === -1) {
      return res.status(404).json({
        sucess: false,
        message: `There are no items with ID ${itemId} for user ID ${userId}`,
      });
    }

    items.splice(itemindex, 1);

    return res.status(200).json({
      sucess: true,
      message: `Item ID ${itemId} for user ID ${userId} has been deleted successfully`,
      data: items,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

export default router;
