import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  try {
    //Pehle cookies se userToken nikalna (main website frontend ke liye)
    let token = req.cookies?.userToken;

    // Agar cookie me token nahi hai to Authorization header se nikalna (dashboard frontend ke liye)
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Agar phir bhi token nahi mila
    if (!token || token === "null" || token.trim() === "") {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    // 🔐 4️⃣ Token verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id || decoded.userId;

    if (!userId) {
      return res.status(401).json({ error: "Invalid token: No User ID found." });
    }

    // 👤 5️⃣ User fetch
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    req.user = user;
    req.userId = user._id;

    next();
  } catch (err) {
    console.error("❌ User JWT verification error:", err.message);
    return res.status(401).json({ error: "Token invalid or expired." });
  }
};

export default authMiddleware;