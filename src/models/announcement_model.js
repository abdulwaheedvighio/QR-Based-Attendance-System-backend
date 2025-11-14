const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  targetType: {
    type: String,
    enum: ['All', 'Teacher'], // 🔥 kis ko bhejni hai
    default: 'All',
  },
  targetTeacherIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher', // ya 'User' if teachers stored in User model
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Announcement', announcementSchema);
