// =====================================================
// ADD THIS CODE TO YOUR EXISTING DynamicOptions Lambda
// =====================================================

// 1. Add these table names at the top of your file (after your existing imports)
const USER_TABLES = {
  users: "nxtgrnd-users",
  dashboards: "nxtgrnd-user-dashboards",
  preferences: "nxtgrnd-user-preferences"
};

// 2. In your main handler, ADD this block BEFORE your existing if statements:
/*
export const handler = async (event) => {
  console.log("Received Event:", JSON.stringify(event, null, 2));

  try {
    const { httpMethod, path } = event;

    // ========== ADD THIS BLOCK ==========
    if (path.includes('/user/')) {
      return await handleUserDataRequest(event, httpMethod, path);
    }
    // ====================================

    // ... your existing code continues below
    if (httpMethod === "GET") {
      return await handleGetRequest(event);
    }
    // etc...
  }
};
*/

// 3. Add ALL of these functions to your Lambda:

const handleUserDataRequest = async (event, httpMethod, path) => {
  const queryParams = event.queryStringParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};
  const userId = queryParams.userId || body.userId;

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  if (!userId) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'userId is required' })
    };
  }

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

const handleProfile = async (method, userId, body) => {
  switch (method) {
    case 'GET':
      try {
        const result = await dynamodb.send(new GetCommand({
          TableName: USER_TABLES.users,
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
          TableName: USER_TABLES.users,
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

    default:
      return response(405, { error: 'Method not allowed' });
  }
};

const handleDashboard = async (method, userId, body) => {
  switch (method) {
    case 'GET':
      try {
        const result = await dynamodb.send(new GetCommand({
          TableName: USER_TABLES.dashboards,
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
          TableName: USER_TABLES.dashboards,
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

    default:
      return response(405, { error: 'Method not allowed' });
  }
};

const handlePreferences = async (method, userId, body) => {
  switch (method) {
    case 'GET':
      try {
        const result = await dynamodb.send(new GetCommand({
          TableName: USER_TABLES.preferences,
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
          TableName: USER_TABLES.preferences,
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

    default:
      return response(405, { error: 'Method not allowed' });
  }
};

const handleAllData = async (method, userId, body) => {
  switch (method) {
    case 'GET':
      try {
        const [profile, dashboard, preferences] = await Promise.all([
          dynamodb.send(new GetCommand({ TableName: USER_TABLES.users, Key: { userId } })),
          dynamodb.send(new GetCommand({ TableName: USER_TABLES.dashboards, Key: { userId } })),
          dynamodb.send(new GetCommand({ TableName: USER_TABLES.preferences, Key: { userId } }))
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
            TableName: USER_TABLES.users,
            Item: { userId, ...body.profile, updatedAt: timestamp }
          })));
        }

        if (body.dashboard) {
          promises.push(dynamodb.send(new PutCommand({
            TableName: USER_TABLES.dashboards,
            Item: { userId, ...body.dashboard, updatedAt: timestamp }
          })));
        }

        if (body.preferences) {
          promises.push(dynamodb.send(new PutCommand({
            TableName: USER_TABLES.preferences,
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
          dynamodb.send(new DeleteCommand({ TableName: USER_TABLES.users, Key: { userId } })),
          dynamodb.send(new DeleteCommand({ TableName: USER_TABLES.dashboards, Key: { userId } })),
          dynamodb.send(new DeleteCommand({ TableName: USER_TABLES.preferences, Key: { userId } }))
        ]);
        return response(200, { success: true });
      } catch (error) {
        return response(500, { error: error.message });
      }

    default:
      return response(405, { error: 'Method not allowed' });
  }
};

// Helper functions
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

// =====================================================
// ALSO: Make sure you have PutCommand and DeleteCommand imported!
// Your imports should include:
//
// import {
//   DynamoDBDocumentClient,
//   QueryCommand,
//   BatchWriteCommand,
//   GetCommand,
//   PutCommand,      // <-- ADD THIS
//   DeleteCommand,   // <-- ADD THIS
// } from "@aws-sdk/lib-dynamodb";
// =====================================================
