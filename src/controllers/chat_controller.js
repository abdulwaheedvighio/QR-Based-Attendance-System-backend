const Chat = require("../models/chat_model");

// ============================
// 💬 Send a Message
// ============================
const sendMessage = async (req, res) => {
  try {
    const { senderId, senderModel, recieverId, recieverModel, message } = req.body;

    if (!senderId || !senderModel || !recieverId || !recieverModel || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const newMessage = await Chat.create({
      senderId,
      senderModel,
      recieverId,
      recieverModel,
      message,
    });

    res.status(201).json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Server error while sending message",
      error: error.message,
    });
  }
};

// ============================
// 📄 Get Chat Between Two Users
// ============================
const getMessages = async (req, res) => {
  try {
    const { user1Id, user1Model, user2Id, user2Model } = req.params;

    if (!user1Id || !user1Model || !user2Id || !user2Model) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const messages = await Chat.find({
      $or: [
        { senderId: user1Id, senderModel: user1Model, recieverId: user2Id, recieverModel: user2Model },
        { senderId: user2Id, senderModel: user2Model, recieverId: user1Id, recieverModel: user1Model }
      ]
    }).sort({ createdAt: 1 }); // Oldest first

    res.status(200).json({
      success: true,
      total: messages.length,
      messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching messages",
      error: error.message,
    });
  }
};

// ============================
// ✅ Mark Message as Seen
// ============================
const markAsSeen = async (req, res) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: "Chat ID is required",
      });
    }

    const updatedMessage = await Chat.findByIdAndUpdate(
      chatId,
      { seen: true },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: updatedMessage,
    });
  } catch (error) {
    console.error("Error marking message as seen:", error);
    res.status(500).json({
      success: false,
      message: "Server error while marking message as seen",
      error: error.message,
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  markAsSeen,
};
