const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a job title'],
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Please add a location'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Engineering', 'Design', 'Marketing', 'Sales', 'Support'],
    default: 'Engineering'
  },
  description: {
    type: String,
    required: [true, 'Please add a job description']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// This line registers the model. It must only happen once per runtime.
module.exports = mongoose.model('Job', jobSchema);