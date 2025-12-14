// Lambda function for User Data API
// Handles DynamoDB operations for user persistence

const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Table names
const TABLES = {
  users: process.env.USERS_TABLE || 'nxtgrnd-users',
  dashboards: process.env.DASHBOARDS_TABLE || 'nxtgrnd-user-dashboards',
  preferences: process.env.PREFERENCES_TABLE || 'nxtgrnd-user-preferences'
};

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Parse request
  const httpMethod = event.httpMethod || event.requestContext?.http?.method;
  const path = event.path || event.rawPath;

  let body;
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch (e) {
    body = {};
  }

  // Extract user ID from Cognito authorizer or body
  const userId = event.requestContext?.authorizer?.claims?.sub ||
                 event.requestContext?.authorizer?.jwt?.claims?.sub ||
                 body?.userId;

  if (!userId) {
    return response(401, { error: 'Unauthorized - No user ID' });
  }

  try {
    // Route based on path
    if (path.includes('/user/profile')) {
      return await handleProfile(httpMethod, userId, body);
    } else if (path.includes('/user/dashboard')) {
      return await handleDashboard(httpMethod, userId, body);
    } else if (path.includes('/user/preferences')) {
      return await handlePreferences(httpMethod, userId, body);
    } else if (path.includes('/user/all')) {
      return await handleAllData(httpMethod, userId, body);
    } else {
      return response(404, { error: 'Not found' });
    }
  } catch (error) {
    console.error('Error:', error);
    return response(500, { error: error.message });
  }
};

// Profile handlers
async function handleProfile(method, userId, body) {
  switch (method) {
    case 'GET':
      const profile = await dynamodb.get({
        TableName: TABLES.users,
        Key: { userId }
      }).promise();
      return response(200, { profile: profile.Item || null });

    case 'POST':
    case 'PUT':
      await dynamodb.put({
        TableName: TABLES.users,
        Item: {
          userId,
          ...body.profile,
          updatedAt: new Date().toISOString()
        }
      }).promise();
      return response(200, { success: true });

    case 'DELETE':
      await dynamodb.delete({
        TableName: TABLES.users,
        Key: { userId }
      }).promise();
      return response(200, { success: true });

    default:
      return response(405, { error: 'Method not allowed' });
  }
}

// Dashboard handlers
async function handleDashboard(method, userId, body) {
  switch (method) {
    case 'GET':
      const dashboard = await dynamodb.get({
        TableName: TABLES.dashboards,
        Key: { userId }
      }).promise();
      return response(200, { dashboard: dashboard.Item || null });

    case 'POST':
    case 'PUT':
      await dynamodb.put({
        TableName: TABLES.dashboards,
        Item: {
          userId,
          ...body.dashboard,
          updatedAt: new Date().toISOString()
        }
      }).promise();
      return response(200, { success: true });

    case 'DELETE':
      await dynamodb.delete({
        TableName: TABLES.dashboards,
        Key: { userId }
      }).promise();
      return response(200, { success: true });

    default:
      return response(405, { error: 'Method not allowed' });
  }
}

// Preferences handlers
async function handlePreferences(method, userId, body) {
  switch (method) {
    case 'GET':
      const prefs = await dynamodb.get({
        TableName: TABLES.preferences,
        Key: { userId }
      }).promise();
      return response(200, { preferences: prefs.Item || null });

    case 'POST':
    case 'PUT':
      await dynamodb.put({
        TableName: TABLES.preferences,
        Item: {
          userId,
          ...body.preferences,
          updatedAt: new Date().toISOString()
        }
      }).promise();
      return response(200, { success: true });

    case 'DELETE':
      await dynamodb.delete({
        TableName: TABLES.preferences,
        Key: { userId }
      }).promise();
      return response(200, { success: true });

    default:
      return response(405, { error: 'Method not allowed' });
  }
}

// All data handlers (for sync)
async function handleAllData(method, userId, body) {
  switch (method) {
    case 'GET':
      const [profile, dashboard, preferences] = await Promise.all([
        dynamodb.get({ TableName: TABLES.users, Key: { userId } }).promise(),
        dynamodb.get({ TableName: TABLES.dashboards, Key: { userId } }).promise(),
        dynamodb.get({ TableName: TABLES.preferences, Key: { userId } }).promise()
      ]);

      return response(200, {
        profile: profile.Item || null,
        dashboard: dashboard.Item || null,
        preferences: preferences.Item || null,
        hasData: !!(profile.Item || dashboard.Item || preferences.Item)
      });

    case 'POST':
      const promises = [];

      if (body.profile) {
        promises.push(dynamodb.put({
          TableName: TABLES.users,
          Item: { userId, ...body.profile, updatedAt: new Date().toISOString() }
        }).promise());
      }

      if (body.dashboard) {
        promises.push(dynamodb.put({
          TableName: TABLES.dashboards,
          Item: { userId, ...body.dashboard, updatedAt: new Date().toISOString() }
        }).promise());
      }

      if (body.preferences) {
        promises.push(dynamodb.put({
          TableName: TABLES.preferences,
          Item: { userId, ...body.preferences, updatedAt: new Date().toISOString() }
        }).promise());
      }

      await Promise.all(promises);
      return response(200, { success: true });

    case 'DELETE':
      await Promise.all([
        dynamodb.delete({ TableName: TABLES.users, Key: { userId } }).promise(),
        dynamodb.delete({ TableName: TABLES.dashboards, Key: { userId } }).promise(),
        dynamodb.delete({ TableName: TABLES.preferences, Key: { userId } }).promise()
      ]);
      return response(200, { success: true });

    default:
      return response(405, { error: 'Method not allowed' });
  }
}

// Helper for responses
function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };
}
