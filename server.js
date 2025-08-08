require('dotenv').config();
const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Configure AWS services
const bedrock = new AWS.BedrockRuntime({
  region: process.env.AWS_REGION || 'us-west-2'
});

const bedrockAgent = new AWS.BedrockAgentRuntime({
  region: process.env.AWS_REGION || 'us-west-2'
});

const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'us-west-2'
});

// Load training catalog from PDF
let trainingCatalog = '';
let courseDescriptions = {};

async function loadTrainingData() {
  try {
    const bucketName = process.env.S3_BUCKET_NAME;
    
    if (!bucketName) {
      console.error('No S3 bucket configured - S3_BUCKET_NAME required');
      return;
    }
    
    // Load CSV training catalog from S3
    try {
      const csvParams = {
        Bucket: bucketName,
        Key: 'training_catalog.csv'
      };
      const csvObject = await s3.getObject(csvParams).promise();
      trainingCatalog = csvObject.Body.toString();
      console.log('Loaded training catalog from S3');
    } catch (error) {
      console.log('Training catalog not found in S3:', error.message);
    }
    
    // Load course descriptions from S3
    try {
      const courseParams = {
        Bucket: bucketName,
        Key: 'course_info.json'
      };
      const courseObject = await s3.getObject(courseParams).promise();
      const courseData = JSON.parse(courseObject.Body.toString());
      
      if (Array.isArray(courseData)) {
        // Handle array format: [{"Department": {"courses": {...}}}]
        courseData.forEach(deptObj => {
          const deptName = Object.keys(deptObj)[0];
          const courses = deptObj[deptName].courses;
          Object.assign(courseDescriptions, courses);
        });
      } else if (typeof courseData === 'object') {
        // Handle object format: {"Department Name": {"courses": {...}}}
        Object.keys(courseData).forEach(deptName => {
          const deptData = courseData[deptName];
          if (deptData && deptData.courses) {
            Object.assign(courseDescriptions, deptData.courses);
          }
        });
      }
      
      console.log('Loaded course descriptions from S3:', Object.keys(courseDescriptions).length, 'courses');
    } catch (error) {
      console.log('Course info not found in S3:', error.message);
    }
    
  } catch (error) {
    console.error('Error loading training data from S3:', error);
    console.error('Local files disabled - must use S3');
  }
}

async function loadLocalTrainingData() {
  try {
    // Load CSV training catalog locally
    if (fs.existsSync('data/training_catalog.csv')) {
      trainingCatalog = fs.readFileSync('data/training_catalog.csv', 'utf8');
    }
    
    // Load course descriptions locally
    if (fs.existsSync('data/course_info.json')) {
      const courseData = JSON.parse(fs.readFileSync('data/course_info.json', 'utf8'));
      courseData.forEach(deptObj => {
        const deptName = Object.keys(deptObj)[0];
        const courses = deptObj[deptName].courses;
        Object.assign(courseDescriptions, courses);
      });
    }
  } catch (error) {
    console.error('Error loading local training data:', error);
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
    modelId: 'arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0',
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

// POST endpoint for chatbot knowledge base queries
app.post('/api/bedrock-query', async (req, res) => {
  try {
    const { knowledgeBaseId, modelArn, input } = req.body;
    console.log('Knowledge base query:', { knowledgeBaseId, modelArn, inputText: input?.text });

    const params = {
      input,
      retrieveAndGenerateConfiguration: {
        type: 'KNOWLEDGE_BASE',
        knowledgeBaseConfiguration: {
          knowledgeBaseId,
          modelArn
        }
      }
    };

    console.log('Calling Bedrock with params:', JSON.stringify(params, null, 2));
    const response = await bedrockAgent.retrieveAndGenerate(params).promise();
    
    res.json({
      output: {
        text: response.output.text
      }
    });
  } catch (error) {
    console.error('Bedrock query error:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    
    res.status(500).json({ 
      error: 'Failed to query knowledge base',
      details: error.message 
    });
  }
});

// POST endpoint to reset all data
app.post('/api/reset', (req, res) => {
  console.log('Reset requested - clearing all data');
  res.json({ message: 'Data reset successfully' });
});

// GET endpoint for course data
app.get('/api/courseData', (req, res) => {
  console.log('Course data requested');
  console.log('Available course descriptions:', Object.keys(courseDescriptions).length);
  
  if (Object.keys(courseDescriptions).length === 0) {
    console.log('No course descriptions loaded - check S3 data');
    return res.json([]);
  }
  
  // Convert courseDescriptions object to the expected format
  const departments = {};
  
  Object.keys(courseDescriptions).forEach(courseCode => {
    const deptCode = courseCode.split(' ')[0]; // Extract department (e.g., "AERO" from "AERO 121")
    
    if (!departments[deptCode]) {
      departments[deptCode] = { courses: {} };
    }
    
    departments[deptCode].courses[courseCode] = courseDescriptions[courseCode];
  });
  
  // Convert to array format expected by frontend
  const departmentArray = Object.keys(departments).map(deptName => ({
    [deptName]: departments[deptName]
  }));
  
  console.log('Returning departments:', Object.keys(departments));
  res.json(departmentArray);
});

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
    
    // Debug: Check what data we're sending to the model
    console.log('Training catalog length:', trainingCatalog.length);
    console.log('Training catalog preview:', trainingCatalog.substring(0, 200));
    console.log('Selected course descriptions:', selectedCourseDescriptions);
    
    // Step 1: First Bedrock call with training catalog and course descriptions
    const firstPrompt = `TRAINING CATALOG:\n${trainingCatalog}\n\nCOURSE DESCRIPTIONS:\n${selectedCourseDescriptions}\n\nBased on the training catalog and course descriptions above, pick the best-fit safety trainings for these courses: ${courses.join(', ')}\n\nReturn only a JSON array of training names from the catalog.`;
    
    console.log('Sending prompt to Bedrock (first 500 chars):', firstPrompt.substring(0, 500));
    const firstResponse = await callBedrock(firstPrompt);
    console.log('Bedrock first response:', firstResponse);
    
    // Extract JSON array from response
    const jsonMatch = firstResponse.match(/\[.*?\]/s);
    if (!jsonMatch) {
      throw new Error('No JSON array found in Bedrock response');
    }
    const initialTrainings = JSON.parse(jsonMatch[0]);
    
    // Step 2: Second Bedrock call to refine selections
    const secondPrompt = `TRAINING CATALOG:\n${trainingCatalog}\n\nCOURSE DESCRIPTIONS:\n${selectedCourseDescriptions}\n\nInitial training selections: ${initialTrainings.join(', ')}\n\nReview the training catalog details and course descriptions. Narrow down to the most essential safety trainings for these specific courses. Return only a JSON array of final training names.`;
    
    const finalResponse = await callBedrock(secondPrompt);
    console.log('Bedrock second response:', finalResponse);
    
    // Extract JSON array from final response
    const finalJsonMatch = finalResponse.match(/\[.*?\]/s);
    if (!finalJsonMatch) {
      throw new Error('No JSON array found in final Bedrock response');
    }
    const finalTrainings = JSON.parse(finalJsonMatch[0]);
    
    // Add full course names to response
    const courseNames = courses.map(code => {
      const course = courseDescriptions[code];
      return course ? `${code}: ${course.name}` : code;
    });
    
    res.json({ 
      trainings: finalTrainings,
      courses: courseNames
    });
  } catch (error) {
    console.error('Bedrock error:', error);
    // Fallback to basic mapping if Bedrock fails
    const trainingsSet = new Set();
    req.body.courses.forEach(courseCode => {
      const requiredTrainings = fallbackTrainings[courseCode] || ["General EHS Orientation"];
      requiredTrainings.forEach(training => trainingsSet.add(training));
    });
    
    // Add full course names to fallback response
    const courseNames = req.body.courses.map(code => {
      const course = courseDescriptions[code];
      return course ? `${code}: ${course.name}` : code;
    });
    
    res.json({ 
      trainings: Array.from(trainingsSet),
      courses: courseNames
    });
  }
});

// Serve static files
app.use(express.static(__dirname));

// Serve index.html at root
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Start server
app.listen(PORT, () => {
  console.log(`AI-powered training API server running on port ${PORT}`);
});

module.exports = app;