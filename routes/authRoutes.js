import express from "express";
const router = express.Router();
import upload from "../middleware/upload.js";

import {
  registerUser,
  loginUser,
  profile,
  logoutUser,
  updateProfile,
} from "../controllers/UserController/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", authMiddleware, logoutUser);
router.get("/profile", authMiddleware, profile);
router.put("/profile", authMiddleware, upload.single("profileImage"), updateProfile); 

export default router;