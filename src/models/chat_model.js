const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "senderModel",
    },
    recieverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "recieverModel",
    },
    senderModel: {
  type: String,
  required: true,
  enum: ["Student", "Teacher"],
},
recieverModel: {
  type: String,
  required: true,
  enum: ["Student", "Teacher"],
},

message: {
      type: String,
      required: true,
      trim: true,
},
seen: {
    type: Boolean,
    default: false,
},
},
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);
