// routes/problem.js
import express from "express";
import upload from "../middleware/upload.js";
import {
  createProblem,
  getAllProblems,
  updateStatus,
  upvote,
  comment,
} from "../controllers/ProblemController/problemController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import Problem from "../models/Problem.js";

const router = express.Router();

router.post(
  "/create",
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ error: "Your image is more than 10MB" });
        }
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  authMiddleware,
  createProblem
);

router.get("/", getAllProblems);
router.get("/:id/:title", async (req, res) => {
  const { id } = req.params;
  try {
    const problem = await Problem.findById(id).populate("userId", "name profileImage");
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    res.json(problem);
  } catch (err) {
    console.error("Error fetching problem by id:", err);
    res.status(500).json({ message: "Server error" });
  }
});
router.put("/:id/upvote", authMiddleware, upvote);
router.put("/:id/status", authMiddleware, updateStatus);
router.post("/:id/comment", authMiddleware, comment);

export default router;
