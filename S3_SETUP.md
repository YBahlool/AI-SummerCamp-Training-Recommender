# S3 Setup Instructions

## Step 1: Create S3 Bucket
1. Go to AWS Console → S3
2. Click "Create bucket"
3. Name: `your-training-data-bucket` (must be globally unique)
4. Region: Same as your `.env` file
5. Keep default settings and create

## Step 2: Upload Files to S3
Upload these files to your bucket:
- `course_info.json` (your existing course data)
- `training_catalog.csv` (your training CSV file)

## Step 3: Update IAM Permissions
Add S3 permissions to your AWS user:
1. IAM → Users → Your user → Permissions
2. Add policy: `AmazonS3ReadOnlyAccess`

## Step 4: Update .env File
Replace `your-training-data-bucket` with your actual bucket name:
```
S3_BUCKET_NAME=my-actual-bucket-name
```

## Step 5: Test
Restart server - it will try S3 first, fallback to local files if S3 fails.

## Benefits
- Centralized data storage
- Easy updates without code changes
- Scalable for multiple environments