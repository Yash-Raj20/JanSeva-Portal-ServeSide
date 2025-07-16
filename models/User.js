import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String },
  phone: { type: String },
  location: { type: String },
  profileImage: { type: String, default: "" },
  profileImagePublicId: { type: String, default: "" },
  dob: { type: Date },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
  },
  createdAt: { type: Date, default: Date.now },

  loginActivity: [
    {
      timestamp: { type: Date },
      device: { type: String },
      location: { type: String },
      ip: { type: String },
    },
  ],
});

export default mongoose.model("User", userSchema);
