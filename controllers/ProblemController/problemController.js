import Problem from "../../models/Problem.js";
import Notification from "../../models/Notification.js";
import { createNotification } from "../NotificationController/notifyController.js";
import { io } from "../../index.js";

// ---------------------- Create a Problem ----------------------
export const createProblem = async (req, res) => {
  try {
    const { title, description, location, category, urgency, contact, state, district } =
      req.body;

    if (
      !title ||
      !description ||
      !location ||
      !category ||
      !urgency ||
      !contact ||
      !state ||
      !district ||
      !req.file
    ) {
      return res
        .status(400)
        .json({ error: "All fields including image are required." });
    }

    if (!req.user || (!req.user._id && !req.user.id)) {
      return res.status(401).json({ error: "Unauthorized: User not found." });
    }

    const userId = req.user._id || req.user.id;
    const imageUrl = req.file.path;

    const problem = new Problem({
      title,
      description,
      location,
      category,
      urgency,
      contact,
      state,
      district,
      userId,
      image: imageUrl,
    });

    await problem.save();

    return res.status(201).json({
      message: "Problem submitted successfully.",
      problem,
    });
  } catch (err) {
    console.error("❌ Error submitting problem:", err);
    return res.status(500).json({
      error: "Problem submission failed.",
      details: err.message,
    });
  }
};

// ---------------------- Get All Problems ----------------------
export const getAllProblems = async (req, res) => {
  try {
    const problems = await Problem.find()
      .populate("userId", "name email location phone")
      .sort({ createdAt: -1 });

    return res.status(200).json(problems);
  } catch (err) {
    console.error("Error fetching problems:", err.message);
    return res.status(500).json({ error: "Failed to fetch problems" });
  }
};

// ---------------------- Update Problem Status ----------------------
export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["Pending", "Process", "Resolved"];

  if (!status || !validStatuses.includes(status)) {
    return res
      .status(400)
      .json({ message: "Invalid or missing status value." });
  }

  try {
    const problem = await Problem.findById(id);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    problem.status = status;
    await problem.save();

    const messages = {
      Resolved: `✅ Your problem "${problem.title}" has been resolved!`,
      Process: `🔄 Your problem "${problem.title}" is now being processed.`,
      Pending: `🕒 Your problem "${problem.title}" is still pending.`,
    };

    const type = status.toLowerCase();
    await createNotification(problem.userId, messages[status], type);

    if (io) {
      io.emit("problemStatusUpdated", { problemId: problem._id, status });
    }

    return res
      .status(200)
      .json({ message: "Status updated successfully", problem });
  } catch (error) {
    console.error("Error updating problem status:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// ---------------------- Upvote a Problem ----------------------
export const upvote = async (req, res) => {
  try {
    const problemId = req.params.id;
    const userId = req.user?._id?.toString() || req.user?.id?.toString();

    if (!userId) {
      return res
        .status(401)
        .json({ message: "You must be logged in to upvote." });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const hasUpvoted = problem.upvotes.some((id) => id.toString() === userId);

    if (hasUpvoted) {
      problem.upvotes = problem.upvotes.filter(
        (id) => id.toString() !== userId
      );
      await problem.save();
      return res.status(200).json({
        message: "Upvote removed successfully",
        upvotes: problem.upvotes.length,
      });
    } else {
      problem.upvotes.push(userId);
      await problem.save();
      return res.status(200).json({
        message: "Upvoted successfully",
        upvotes: problem.upvotes.length,
      });
    }
  } catch (error) {
    console.error("Error in upvoting:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ---------------------- Assign Problem ----------------------
export const assignProblem = async (req, res) => {
  try {
    const problemId = req.params.id;
    const { subAdminId } = req.body;

    if (!subAdminId) {
      return res.status(400).json({ message: "Sub-admin ID is required." });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    problem.assignedTo = subAdminId;
    problem.status = "assigned";
    await problem.save();

    return res.status(200).json({ message: "Problem assigned successfully" });
  } catch (error) {
    console.error("Error assigning problem:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};


// ---------------------- Add Comment to Issue ----------------------
export const comment = async (req, res) => {
  try {
    const { text } = req.body;
    const issue = await Problem.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    issue.comments.push({
      user: req.user._id,
      text,
    });

    await issue.save();
    return res.status(200).json({ message: "Comment added successfully" });
  } catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
