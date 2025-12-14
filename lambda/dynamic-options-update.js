// UPDATED Dynamic Options Lambda
// Add these routes to your existing dynamic-options Lambda to handle user data persistence
// This extends your current Lambda - DON'T replace it, just add these handlers

import {
  DynamoDBDocumentClient,
  QueryCommand,
  BatchWriteCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

// Table names - using your existing pattern
const TABLES = {
  users: "nxtgrnd-users",           // NEW - for user profile data
  dashboards: "nxtgrnd-user-dashboards",  // NEW - for dashboard/career path
  preferences: "nxtgrnd-user-preferences", // NEW - for user preferences
  dynamicOptions: "DynamicOptions",  // EXISTING
  existingUsers: "Users"             // EXISTING
};

export const handler = async (event) => {
  console.log("Received Event:", JSON.stringify(event, null, 2));

  try {
    const { httpMethod, path } = event;

    // EXISTING routes - keep your current logic
    if (path === '/dynamic-options' || path === '/dev/dynamic-options') {
      if (httpMethod === "GET") {
        return await handleGetRequest(event);
      } else if (httpMethod === "POST") {
        return await handlePostRequest(event);
      }
    }

    // NEW routes for user data persistence
    if (path.includes('/user/')) {
      return await handleUserDataRequest(event, httpMethod, path);
    }

    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  } catch (error) {
    console.error("Error handling request:", error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
    };
  }
};

// ============== NEW: User Data Persistence Handlers ==============

const handleUserDataRequest = async (event, httpMethod, path) => {
  // Extract userId from query params or body
  const queryParams = event.queryStringParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};
  const userId = queryParams.userId || body.userId;

  if (!userId && httpMethod !== 'OPTIONS') {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'userId is required' })
    };
  }

  // Handle OPTIONS for CORS
  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  // Route to appropriate handler
  if (path.includes('/user/profile')) {
    return await handleProfile(httpMethod, userId, body);
  } else if (path.includes('/user/dashboard')) {
    return await handleDashboard(httpMethod, userId, body);
  } else if (path.includes('/user/preferences')) {
    return await handlePreferences(httpMethod, userId, body);
  } else if (path.includes('/user/all')) {
    return await handleAllData(httpMethod, userId, body);
  }

  return {
    statusCode: 404,
    headers: corsHeaders(),
    body: JSON.stringify({ error: 'Not found' })
  };
};

// Profile handlers
const handleProfile = async (method, userId, body) => {
  switch (method) {
    case 'GET':
      try {
        const result = await dynamodb.send(new GetCommand({
          TableName: TABLES.users,
          Key: { userId }
        }));
        return response(200, { profile: result.Item || null });
      } catch (error) {
        console.error('Error getting profile:', error);
        return response(500, { error: error.message });
      }

    case 'POST':
    case 'PUT':
      try {
        await dynamodb.send(new PutCommand({
          TableName: TABLES.users,
          Item: {
            userId,
            ...body.profile,
            updatedAt: new Date().toISOString()
          }
        }));
        return response(200, { success: true });
      } catch (error) {
        console.error('Error saving profile:', error);
        return response(500, { error: error.message });
      }

    case 'DELETE':
      try {
        await dynamodb.send(new DeleteCommand({
          TableName: TABLES.users,
          Key: { userId }
        }));
        return response(200, { success: true });
      } catch (error) {
        return response(500, { error: error.message });
      }

    default:
      return response(405, { error: 'Method not allowed' });
  }
};

// Dashboard handlers
const handleDashboard = async (method, userId, body) => {
  switch (method) {
    case 'GET':
      try {
        const result = await dynamodb.send(new GetCommand({
          TableName: TABLES.dashboards,
          Key: { userId }
        }));
        return response(200, { dashboard: result.Item || null });
      } catch (error) {
        return response(500, { error: error.message });
      }

    case 'POST':
    case 'PUT':
      try {
        await dynamodb.send(new PutCommand({
          TableName: TABLES.dashboards,
          Item: {
            userId,
            ...body.dashboard,
            updatedAt: new Date().toISOString()
          }
        }));
        return response(200, { success: true });
      } catch (error) {
        return response(500, { error: error.message });
      }

    case 'DELETE':
      try {
        await dynamodb.send(new DeleteCommand({
          TableName: TABLES.dashboards,
          Key: { userId }
        }));
        return response(200, { success: true });
      } catch (error) {
        return response(500, { error: error.message });
      }

    default:
      return response(405, { error: 'Method not allowed' });
  }
};

// Preferences handlers
const handlePreferences = async (method, userId, body) => {
  switch (method) {
    case 'GET':
      try {
        const result = await dynamodb.send(new GetCommand({
          TableName: TABLES.preferences,
          Key: { userId }
        }));
        return response(200, { preferences: result.Item || null });
      } catch (error) {
        return response(500, { error: error.message });
      }

    case 'POST':
    case 'PUT':
      try {
        await dynamodb.send(new PutCommand({
          TableName: TABLES.preferences,
          Item: {
            userId,
            ...body.preferences,
            updatedAt: new Date().toISOString()
          }
        }));
        return response(200, { success: true });
      } catch (error) {
        return response(500, { error: error.message });
      }

    case 'DELETE':
      try {
        await dynamodb.send(new DeleteCommand({
          TableName: TABLES.preferences,
          Key: { userId }
        }));
        return response(200, { success: true });
      } catch (error) {
        return response(500, { error: error.message });
      }

    default:
      return response(405, { error: 'Method not allowed' });
  }
};

// All data handler (for sync operations)
const handleAllData = async (method, userId, body) => {
  switch (method) {
    case 'GET':
      try {
        const [profile, dashboard, preferences] = await Promise.all([
          dynamodb.send(new GetCommand({ TableName: TABLES.users, Key: { userId } })),
          dynamodb.send(new GetCommand({ TableName: TABLES.dashboards, Key: { userId } })),
          dynamodb.send(new GetCommand({ TableName: TABLES.preferences, Key: { userId } }))
        ]);

        return response(200, {
          profile: profile.Item || null,
          dashboard: dashboard.Item || null,
          preferences: preferences.Item || null,
          hasData: !!(profile.Item || dashboard.Item || preferences.Item)
        });
      } catch (error) {
        return response(500, { error: error.message });
      }

    case 'POST':
      try {
        const promises = [];
        const timestamp = new Date().toISOString();

        if (body.profile) {
          promises.push(dynamodb.send(new PutCommand({
            TableName: TABLES.users,
            Item: { userId, ...body.profile, updatedAt: timestamp }
          })));
        }

        if (body.dashboard) {
          promises.push(dynamodb.send(new PutCommand({
            TableName: TABLES.dashboards,
            Item: { userId, ...body.dashboard, updatedAt: timestamp }
          })));
        }

        if (body.preferences) {
          promises.push(dynamodb.send(new PutCommand({
            TableName: TABLES.preferences,
            Item: { userId, ...body.preferences, updatedAt: timestamp }
          })));
        }

        await Promise.all(promises);
        return response(200, { success: true });
      } catch (error) {
        return response(500, { error: error.message });
      }

    case 'DELETE':
      try {
        await Promise.all([
          dynamodb.send(new DeleteCommand({ TableName: TABLES.users, Key: { userId } })),
          dynamodb.send(new DeleteCommand({ TableName: TABLES.dashboards, Key: { userId } })),
          dynamodb.send(new DeleteCommand({ TableName: TABLES.preferences, Key: { userId } }))
        ]);
        return response(200, { success: true });
      } catch (error) {
        return response(500, { error: error.message });
      }

    default:
      return response(405, { error: 'Method not allowed' });
  }
};

// ============== EXISTING: Your current handlers (keep these) ==============

const handleGetRequest = async (event) => {
  // YOUR EXISTING CODE - don't change
  console.log("GET Request Parameters:", JSON.stringify(event.queryStringParameters));
  const { category, userId } = event.queryStringParameters || {};
  // ... rest of your existing code
};

const handlePostRequest = async (event) => {
  // YOUR EXISTING CODE - don't change
  const body = JSON.parse(event.body || "{}");
  // ... rest of your existing code
};

// ============== Helpers ==============

const corsHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json'
});

const response = (statusCode, body) => ({
  statusCode,
  headers: corsHeaders(),
  body: JSON.stringify(body)
});
