# DynamoDB Setup Guide for NxtGrnd AI

## Required Tables

Create the following 3 tables in the AWS Console (DynamoDB):

### 1. nxtgrnd-users
- **Table Name:** `nxtgrnd-users`
- **Partition Key:** `userId` (String)
- **Billing Mode:** On-Demand (recommended for variable workload)

### 2. nxtgrnd-user-dashboards
- **Table Name:** `nxtgrnd-user-dashboards`
- **Partition Key:** `userId` (String)
- **Billing Mode:** On-Demand

### 3. nxtgrnd-user-preferences
- **Table Name:** `nxtgrnd-user-preferences`
- **Partition Key:** `userId` (String)
- **Billing Mode:** On-Demand

## Steps to Create Tables

1. Go to AWS Console > DynamoDB
2. Click "Create table"
3. Enter table name (e.g., `nxtgrnd-users`)
4. Enter partition key: `userId` with type `String`
5. Under "Table settings", choose "Customize settings"
6. For "Read/write capacity settings", select "On-demand"
7. Click "Create table"
8. Repeat for all 3 tables

## IAM Policy for Cognito Users

Your Cognito Identity Pool needs permissions to access DynamoDB. Add this policy to the **authenticated role**:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query"
            ],
            "Resource": [
                "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/nxtgrnd-users",
                "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/nxtgrnd-user-dashboards",
                "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/nxtgrnd-user-preferences"
            ],
            "Condition": {
                "ForAllValues:StringEquals": {
                    "dynamodb:LeadingKeys": ["${cognito-identity.amazonaws.com:sub}"]
                }
            }
        }
    ]
}
```

**Important:** Replace `YOUR_ACCOUNT_ID` with your AWS account ID.

## Setting Up Cognito Identity Pool

If you don't have an Identity Pool linked to your User Pool:

1. Go to AWS Console > Cognito > Federated Identities
2. Click "Create new identity pool"
3. Give it a name (e.g., `nxtgrnd-identity-pool`)
4. Under "Authentication providers" > "Cognito", enter:
   - User Pool ID: `us-east-1_nZs87K3XT`
   - App client id: `82vo982u03f2ou1htfvsagf43`
5. Click "Create Pool"
6. On the next screen, expand "View Details"
7. Note the authenticated role ARN
8. Click "Allow" to create the roles

### Update the Authenticated Role

1. Go to AWS Console > IAM > Roles
2. Find the role created for authenticated users (e.g., `Cognito_nxtgrndAuth_Role`)
3. Click "Add permissions" > "Create inline policy"
4. Go to JSON tab and paste the DynamoDB policy above
5. Click "Review policy" and give it a name (e.g., `DynamoDB-UserData-Access`)
6. Click "Create policy"

## Environment Variables (Optional)

If you want to use different table names, set these in your `.env`:

```
REACT_APP_DYNAMODB_USERS_TABLE=nxtgrnd-users
REACT_APP_DYNAMODB_DASHBOARDS_TABLE=nxtgrnd-user-dashboards
REACT_APP_DYNAMODB_PREFERENCES_TABLE=nxtgrnd-user-preferences
```

## Testing the Setup

After setup, you can test by:
1. Logging into the app
2. Complete onboarding or make changes
3. Check DynamoDB tables in AWS Console for new items
4. Clear browser localStorage
5. Log in again - your data should be restored from DynamoDB

## Data Schema

### nxtgrnd-users
```json
{
  "userId": "cognito-sub-uuid",
  "resume": { /* parsed resume data */ },
  "skills": ["skill1", "skill2"],
  "interests": ["interest1", "interest2"],
  "creatorProfile": { /* creator profile data */ },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### nxtgrnd-user-dashboards
```json
{
  "userId": "cognito-sub-uuid",
  "careerPath": { /* selected career path */ },
  "learningPaths": [ /* learning recommendations */ ],
  "opportunities": [ /* job opportunities */ ],
  "goals": [ /* user goals */ ],
  "events": [ /* milestones/events */ ],
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### nxtgrnd-user-preferences
```json
{
  "userId": "cognito-sub-uuid",
  "pathPreferences": { /* path selection preferences */ },
  "notifications": { /* notification settings */ },
  "achievements": [ /* user achievements */ ],
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
