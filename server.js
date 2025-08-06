const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Mock training mapping
const mockMap = {
  "AERO 121": ["Lab Electrical Safety", "Basic Machine Shop Safety"],
  "AERO 215": ["Powered Hand Tools Safety"],
  "AERO 220": ["Fall Protection"]
};

// POST endpoint for getting required trainings
app.post('/api/getRequiredTrainings', async (req, res) => {
  try {
    const { courses } = req.body;
    console.log('Received request for courses:', courses);

    // Validate input
    if (!Array.isArray(courses)) {
      return res.status(400).json({ error: 'courses must be an array' });
    }

    // Build deduplicated trainings array
    const trainingsSet = new Set();
    
    courses.forEach(courseCode => {
      const requiredTrainings = mockMap[courseCode] || ["General EHS Orientation"];
      requiredTrainings.forEach(training => trainingsSet.add(training));
    });

    // Simulate 300ms delay
    await new Promise(resolve => setTimeout(resolve, 300));

    res.json({ trainings: Array.from(trainingsSet) });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Mock API server running on port ${PORT}`);
});

module.exports = app;