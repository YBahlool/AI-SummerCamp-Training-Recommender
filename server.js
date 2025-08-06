require('dotenv').config();
const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const fs = require('fs');
const pdf = require('pdf-parse');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Configure AWS Bedrock
const bedrock = new AWS.BedrockRuntime({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Load training catalog from PDF
let trainingCatalog = '';
let courseDescriptions = {};

async function loadTrainingData() {
  try {
    // Load PDF training catalog
    if (fs.existsSync('data/training_catalog.pdf')) {
      const pdfBuffer = fs.readFileSync('data/training_catalog.pdf');
      const pdfData = await pdf(pdfBuffer);
      trainingCatalog = pdfData.text;
    }
    
    // Load course descriptions
    if (fs.existsSync('data/course_info.json')) {
      const courseData = JSON.parse(fs.readFileSync('data/course_info.json', 'utf8'));
      courseData.forEach(deptObj => {
        const deptName = Object.keys(deptObj)[0];
        const courses = deptObj[deptName].courses;
        Object.assign(courseDescriptions, courses);
      });
    }
  } catch (error) {
    console.error('Error loading training data:', error);
  }
}

// Initialize training data on startup
loadTrainingData();

// Fallback training descriptions
const fallbackTrainings = {
  "Lab Electrical Safety": "Comprehensive safety training for electrical equipment use in laboratory environments.",
  "Basic Machine Shop Safety": "Essential safety practices for machine shop operations.",
  "Powered Hand Tools Safety": "Safe operation of power tools and equipment.",
  "Fall Protection": "Prevention and protection from falls in elevated work areas.",
  "General EHS Orientation": "General environmental health and safety overview."
};

async function callBedrock(prompt) {
  const params = {
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: prompt
      }]
    })
  };
  
  const response = await bedrock.invokeModel(params).promise();
  const responseBody = JSON.parse(response.body.toString());
  return responseBody.content[0].text;
}

// POST endpoint for getting required trainings
app.post('/api/getRequiredTrainings', async (req, res) => {
  try {
    const { courses } = req.body;
    console.log('Received request for courses:', courses);

    // Validate input
    if (!Array.isArray(courses)) {
      return res.status(400).json({ error: 'courses must be an array' });
    }

    if (courses.length === 0) {
      return res.json({ trainings: [] });
    }

    // Get course descriptions for selected courses
    const selectedCourseDescriptions = courses.map(code => {
      const course = courseDescriptions[code];
      return course ? `${code}: ${course.name} - ${course.description || 'No description available'}` : `${code}: Course not found`;
    }).join('\n');
    
    // Step 1: First Bedrock call with training catalog and course descriptions
    const firstPrompt = `TRAINING CATALOG:\n${trainingCatalog}\n\nCOURSE DESCRIPTIONS:\n${selectedCourseDescriptions}\n\nBased on the training catalog and course descriptions above, pick the best-fit safety trainings for these courses: ${courses.join(', ')}\n\nReturn only a JSON array of training names from the catalog.`;
    
    const firstResponse = await callBedrock(firstPrompt);
    const initialTrainings = JSON.parse(firstResponse.match(/\[.*\]/)[0]);
    
    // Step 2: Second Bedrock call to refine selections
    const secondPrompt = `TRAINING CATALOG:\n${trainingCatalog}\n\nCOURSE DESCRIPTIONS:\n${selectedCourseDescriptions}\n\nInitial training selections: ${initialTrainings.join(', ')}\n\nReview the training catalog details and course descriptions. Narrow down to the most essential safety trainings for these specific courses. Return only a JSON array of final training names.`;
    
    const finalResponse = await callBedrock(secondPrompt);
    const finalTrainings = JSON.parse(finalResponse.match(/\[.*\]/)[0]);
    
    res.json({ trainings: finalTrainings });
  } catch (error) {
    console.error('Bedrock error:', error);
    // Fallback to basic mapping if Bedrock fails
    const trainingsSet = new Set();
    req.body.courses.forEach(courseCode => {
      const requiredTrainings = fallbackTrainings[courseCode] || ["General EHS Orientation"];
      requiredTrainings.forEach(training => trainingsSet.add(training));
    });
    
    res.json({ trainings: Array.from(trainingsSet) });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`AI-powered training API server running on port ${PORT}`);
});

module.exports = app;