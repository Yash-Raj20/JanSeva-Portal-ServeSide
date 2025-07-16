// 📦 Imports
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import validator from "validator";
import geoip from "geoip-lite";
import User from "../../models/User.js";
import Problem from "../../models/Problem.js";
import Notification from "../../models/Notification.js";
import cloudinary from "../../config/cloudinary.js";

// 🔑 Generate JWT Token
const generateToken = (user) => {
  const payload = {
    _id: user._id,
    email: user.email,
    name: user.name,
  };

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not set in environment variables");
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// 🧑‍💻 Register User
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, location } = req.body;

    if (!name || !email || !password || !phone || !location) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      location,
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
};

// 🗝️ Login User with Cookie
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Track login activity
    const getClientIP = (req) => {
      const forwarded = req.headers["x-forwarded-for"];
      return forwarded ? forwarded.split(",")[0].trim() : req.socket?.remoteAddress;
    };

    const userAgent = req.headers["user-agent"] || "Unknown Device";
    const ip = getClientIP(req);
    let location = "Unknown Location";

    if (ip && !["::1", "127.0.0.1", "localhost"].includes(ip)) {
      const geo = geoip.lookup(ip);
      if (geo) {
        location = `${geo.city || "Unknown City"}, ${geo.country || "Unknown Country"}`;
      }
    }

    user.loginActivity = user.loginActivity || [];
    user.loginActivity.push({ device: userAgent, location, timestamp: new Date() });
    if (user.loginActivity.length > 3) {
      user.loginActivity = user.loginActivity.slice(-3);
    }

    await user.save();

    const token = generateToken(user);

    res.cookie("userToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
      message: "Login successful",
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Login failed. Please try again later." });
  }
};

// 🚪 Logout User
export const logoutUser = (req, res) => {
  res
    .clearCookie("userToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    })
    .status(200)
    .json({ message: "Logged out successfully" });
};

// 👤 Get Profile with Problems & Notifications
export const profile = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [problems, notifications] = await Promise.all([
      Problem.find({ userId }).sort({ createdAt: -1 }),
      Notification.find({ user: userId }).sort({ createdAt: -1 }),
    ]);

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        bio: user.bio,
        gender: user.gender,
        dob: user.dob,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        loginActivity: user.loginActivity || [],
      },
      problems,
      notifications,
    });
  } catch (err) {
    console.error("Profile error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ✏️ Update Profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, phone, location, bio, dob, gender } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (location) user.location = location;
    if (bio) user.bio = bio;
    if (dob) user.dob = dob;
    if (gender) user.gender = gender.toLowerCase();

    if (req.file) {
      if (user.profileImagePublicId) {
        await cloudinary.uploader.destroy(user.profileImagePublicId);
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profileImages",
      });

      user.profileImage = result.secure_url;
      user.profileImagePublicId = result.public_id;
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      profileImage: user.profileImage,
      user,
    });
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(500).json({ message: "Failed to update profile" });
  }
};