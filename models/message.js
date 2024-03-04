import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    Chatuser: {
      type: Array,
      require: true,
    },
    message: {
      type: String,
      require: true,
    },
    Sender: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Message", MessageSchema);
