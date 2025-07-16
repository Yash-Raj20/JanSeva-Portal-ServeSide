import mongoose from "mongoose";

const AssignedIssueSchema = new mongoose.Schema({
  issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityMember' },
  status: { type: String, enum: ['Assigned', 'In Progress', 'Completed'], default: 'Assigned' },
  proof: { type: String }, // URL to uploaded photo
  remarks: { type: String }
});

export default mongoose.model('AssignedIssue', AssignedIssueSchema);
