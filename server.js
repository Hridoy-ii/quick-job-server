require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Joi = require('joi');
const connectDB = require('./config/db');
const Job = require('./models/Job');
const Application = require('./models/Application');

// Initialize App
const app = express();

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-admin-key', 'Authorization']
}));

app.use(express.json());



connectDB();

// Middleware
app.use(cors());
app.use(express.json());

/**
 *   --- Admin Authentication Middleware (Secret Key) ---
 * -----------------------------------------------
*/
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKey) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access denied: No admin key provided' 
    });
  }

  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied: Invalid admin key' 
    });
  }

  next(); // Key is valid, proceed to route
};
// -----------------------------------------------


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


/**
 *   POST /api/jobs - Create a job (Admin) 
 *   PROTECTED: Requires x-admin-key header
 * -----------------------------------------------
*/
app.post('/api/jobs', adminAuth, async (req, res) => {
  // Validate Input
  const { error } = jobSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  try {
    const job = await Job.create(req.body);
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create job' });
  }
});
// -----------------------------------------------


/**
 *    DELETE /api/jobs/:id - Delete a job (Admin) 
 *    PROTECTED: Requires x-admin-key header
 * -----------------------------------------------
*/
app.delete('/api/jobs/:id', adminAuth, async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    // Optional: Cascade delete applications associated with this job
    await Application.deleteMany({ job: req.params.id });
    
    res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete job' });
  }
});
// -----------------------------------------------


/**
 *  POST /api/applications - Submit job application
 *  PUBLIC: No auth required
 * -----------------------------------------------
*/
app.post('/api/applications', async (req, res) => {
  // Validate Input
  const { error } = applicationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.details[0].message });
  }

  try {
    // Check if job already exists
    const jobExists = await Job.findById(req.body.job_id);
    if (!jobExists) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const application = await Application.create({
      job: req.body.job_id,
      name: req.body.name,
      email: req.body.email,
      resume_link: req.body.resume_link,
      cover_note: req.body.cover_note
    });

    res.status(201).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to submit application' });
  }
});
// -----------------------------------------------



// --- Server Start ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});