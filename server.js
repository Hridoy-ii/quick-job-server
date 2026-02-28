require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Joi = require('joi');
const connectDB = require('./config/db');
const Job = require('./models/Job');
const Application = require('./models/Application');

// Initialize App
const app = express();
connectDB();

// Middleware
app.use(cors());
app.use(express.json());


/**
 *   --- Validation Schemas (Joi) ---
 * -----------------------------------------------
*/
const jobSchema = Joi.object({
  title: Joi.string().required().min(3),
  company: Joi.string().required().min(2),
  location: Joi.string().required(),
  category: Joi.string().valid('Engineering', 'Design', 'Marketing', 'Sales', 'Support').required(),
  description: Joi.string().required().min(10)
});

const applicationSchema = Joi.object({
  job_id: Joi.string().hex().length(24).required(), 
  name: Joi.string().required().min(2),
  email: Joi.string().email().required(),
  resume_link: Joi.string().uri().required(),
  cover_note: Joi.string().required().min(5)
});

// -----------------------------------------------


/**
 *  --- Routes & Controllers ---
 * -----------------------------------------------
*/

// GET /api/jobs - List all jobs with filter query parameters
app.get('/api/jobs', async (req, res) => {
  try {
    const { category, location, search } = req.query;
    let query = {};

    if (category) query.category = category;
    if (location) query.location = new RegExp(location, 'i'); 
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { company: new RegExp(search, 'i') }
      ];
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// -----------------------------------------------


/**
 *  GET /api/jobs/:id - Get single job details
 * -----------------------------------------------
*/
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// -----------------------------------------------



// --- Server Start ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});