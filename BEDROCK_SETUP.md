# AWS Bedrock Setup Instructions

## Prerequisites
1. AWS Account with Bedrock access
2. Claude 3 Sonnet model enabled in your AWS region

## Setup Steps

### 1. Install Dependencies
```bash
npm install aws-sdk
```

### 2. Configure AWS Credentials
Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

Fill in your AWS credentials:
```
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
```

### 3. Enable Claude 3 Sonnet in Bedrock
1. Go to AWS Bedrock console
2. Navigate to "Model access"
3. Request access to "Claude 3 Sonnet"
4. Wait for approval (usually instant)

### 4. Start the Server
```bash
npm start
```

## How It Works
1. Frontend sends course list to `/api/getRequiredTrainings`
2. Server makes first Bedrock call with training names only
3. Server adds descriptions to selected trainings
4. Server makes second Bedrock call to refine selections
5. Final training list returned to frontend

## Fallback
If Bedrock fails, the system falls back to the original mock mapping to ensure reliability.