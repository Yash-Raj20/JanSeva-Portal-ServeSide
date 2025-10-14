import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  try {
    // 1️⃣ Pehle cookie se token (main website frontend)
    let token = req.cookies?.userToken;
    let secret = process.env.JWT_SECRET;

    // 2️⃣ Agar cookie me token nahi, Authorization header se token (dashboard frontend)
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
      secret = process.env.DASHBOARD_SECRET;
    }

    // 3️⃣ Agar phir bhi token nahi mila
    if (!token || token === "null" || token.trim() === "") {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    // 4️⃣ Token verify using appropriate secret
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      console.error("Token verification failed:", err.message);
      return res.status(401).json({ error: "Token invalid or expired." });
    }

    const userId = decoded.id || decoded._id || decoded.userId;
    if (!userId) {
      return res.status(401).json({ error: "Invalid token: No User ID found." });
    }

    // 5️⃣ User fetch
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    req.user = user;
    req.userId = user._id;

    next();
  } catch (err) {
    console.error("❌ Middleware error:", err.message);
    return res.status(500).json({ error: "Server error in auth middleware." });
  }
};

export default authMiddleware;
