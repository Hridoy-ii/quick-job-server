const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job', // References the string name 'Job', does not recompile it
    required: true
  },
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  resume_link: {
    type: String,
    required: [true, 'Resume link is required'],
    match: [/^https?:\/\/.+/, 'Please provide a valid URL for the resume']
  },
  cover_note: {
    type: String,
    required: [true, 'Cover note is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Register ONLY the Application model here
module.exports = mongoose.model('Application', applicationSchema);