# Risk-Based Training Application

A Cal Poly student dashboard that uses AI to recommend safety training courses based on enrolled classes. The system integrates with AWS Bedrock (Claude 3 Sonnet) to intelligently match course content with required safety trainings.

## Features

- **Student Dashboard**: Cal Poly-themed interface with course management
- **AI-Powered Training Recommendations**: Uses AWS Bedrock to analyze course descriptions and match with safety trainings
- **Shopping Cart System**: Add/remove courses and manage enrollment
- **S3 Integration**: Course data and training catalogs stored in AWS S3
- **Real-time Updates**: Dynamic training recommendations based on course selections

## Architecture

- **Frontend**: Vanilla HTML/CSS/JavaScript with Cal Poly branding
- **Backend**: Node.js/Express API server
- **AI**: AWS Bedrock with Claude 3 Sonnet model
- **Storage**: AWS S3 for course data and training catalogs
- **Data Format**: CSV training catalog, JSON course descriptions

## Prerequisites

- Node.js (v14 or higher)
- AWS Account with Bedrock access
- Claude 3 Sonnet model enabled in AWS Bedrock
- AWS S3 bucket with course data

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd risk-based-training-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure AWS credentials**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your AWS credentials:
   ```
   AWS_ACCESS_KEY_ID=your_access_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_key_here
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your-bucket-name
   PORT=3000
   ```

4. **Set up AWS Bedrock**
   - Go to AWS Bedrock console
   - Navigate to "Model access"
   - Request access to "Claude 3 Sonnet"
   - Wait for approval

5. **Upload data to S3**
   Upload these files to your S3 bucket:
   - `course_info.json` - Course descriptions and metadata
   - `training_catalog.csv` - Available safety training courses

## Data Format

### Course Info (course_info.json)
```json
{
  "Aerospace Engineering (AERO)": {
    "courses": {
      "AERO 121": {
        "name": "Introduction to Aerospace Engineering",
        "description": "Course description here...",
        "units": "2"
      }
    }
  }
}
```

### Training Catalog (training_catalog.csv)
```csv
Learning Hub Course Name,Learning Hub Curriculum Code,Regulatory Requirement
EHS Lab Safety,CALPOLY-LAB-SAFETY,"Students in lab courses"
Machine Shop Safety,CALPOLY-SHOP-SAFETY,"Students using machine shop"
```

## Running the Application

1. **Start the server**
   ```bash
   node server.js
   ```

2. **Open the application**
   - Open `index.html` in a web browser
   - Or use VS Code Live Server extension

## Usage

1. **Browse Courses**: Go to Schedule Builder to see available courses
2. **Add to Cart**: Click "Add to Cart" for desired courses
3. **Register Courses**: Go to Shopping Cart and click "Register All Courses"
4. **View Trainings**: Return to Dashboard to see AI-recommended safety trainings
5. **Reset Demo**: Click "PeopleSoft Homepage" in sidebar to reset for new demo

## API Endpoints

- `GET /api/courseData` - Retrieve course information from S3
- `POST /api/getRequiredTrainings` - Get AI-powered training recommendations
- `POST /api/reset` - Reset demo data

## How It Works

1. **Course Selection**: User adds courses to shopping cart
2. **Registration**: User clicks "Register All Courses"
3. **AI Analysis**: System sends course descriptions and training catalog to Claude 3 Sonnet
4. **Two-Stage Processing**:
   - First call: Match training names to course content
   - Second call: Refine selections based on detailed descriptions
5. **Display Results**: Show recommended trainings on dashboard

## AWS Permissions Required

Your AWS user needs these policies:
- `AmazonBedrockFullAccess`
- `AmazonS3ReadOnlyAccess`

## Troubleshooting

### Server won't start
- Check AWS credentials in `.env` file
- Ensure S3 bucket exists and is accessible
- Verify Node.js is installed

### No courses loading
- Check S3 bucket has `course_info.json`
- Verify AWS credentials have S3 read access
- Check browser console for API errors

### Training recommendations not working
- Ensure Claude 3 Sonnet is enabled in Bedrock
- Check AWS region matches your `.env` file
- Verify `training_catalog.csv` exists in S3

### Fallback behavior
If Bedrock fails, the system falls back to basic training mappings to ensure reliability.

## Demo Instructions

Perfect for panel presentations:
1. Show empty dashboard
2. Add courses (AERO 121, AERO 215, etc.)
3. Register courses to trigger AI analysis
4. Show intelligent training recommendations
5. Reset via "PeopleSoft Homepage" for next demo

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **AI**: AWS Bedrock (Claude 3 Sonnet)
- **Storage**: AWS S3
- **Authentication**: AWS IAM