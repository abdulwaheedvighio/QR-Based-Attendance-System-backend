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
    enum: ['All', 'Teacher', 'Student'], // ✔ Perfect based on your logic
    default: 'All'
  },

  targetTeacherIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher', // ✔ Good: correctly referencing Teacher model
    }
  ],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin', // ✔ Best practice: Admin who created it
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Announcement', announcementSchema);
