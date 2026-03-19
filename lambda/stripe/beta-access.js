// Beta Access Management Lambda
// Checks if an email is approved for closed beta access
// Also provides an endpoint to approve/revoke beta access (admin only)
//
// Environment Variables:
//   BETA_TABLE - DynamoDB table name (default: nxtgrnd-beta-access)
//   ADMIN_EMAILS - Comma-separated list of admin emails
//
// Endpoints:
//   GET  /beta-access?email=user@example.com - Check if email is approved
//   POST /beta-access - Approve an email { email, action: 'approve' | 'revoke' }
//   GET  /beta-access/list - List all approved beta users (admin only)

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const BETA_TABLE = process.env.BETA_TABLE || 'nxtgrnd-beta-access';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

const isAdmin = (email) => ADMIN_EMAILS.includes(email?.toLowerCase());

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const path = event.path || '';
    const method = event.httpMethod;

    // GET /beta-access?email=... - Check beta access
    if (method === 'GET' && !path.endsWith('/list')) {
      const email = event.queryStringParameters?.email;
      if (!email) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'email is required' }) };
      }

      const result = await docClient.send(new GetCommand({
        TableName: BETA_TABLE,
        Key: { email: email.toLowerCase() }
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          approved: !!result.Item,
          email: email.toLowerCase(),
          approvedAt: result.Item?.approvedAt || null
        })
      };
    }

    // GET /beta-access/list - List all beta users (admin only)
    if (method === 'GET' && path.endsWith('/list')) {
      const adminEmail = event.queryStringParameters?.adminEmail;
      if (!isAdmin(adminEmail)) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const result = await docClient.send(new ScanCommand({ TableName: BETA_TABLE }));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ users: result.Items || [], count: result.Count || 0 })
      };
    }

    // POST /beta-access - Approve or revoke beta access (admin only)
    if (method === 'POST') {
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      const { email, action, adminEmail } = body;

      if (!isAdmin(adminEmail)) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      if (!email) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'email is required' }) };
      }

      if (action === 'revoke') {
        await docClient.send(new DeleteCommand({
          TableName: BETA_TABLE,
          Key: { email: email.toLowerCase() }
        }));
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: `Beta access revoked for ${email}` })
        };
      }

      // Default: approve
      await docClient.send(new PutCommand({
        TableName: BETA_TABLE,
        Item: {
          email: email.toLowerCase(),
          approvedAt: new Date().toISOString(),
          approvedBy: adminEmail
        }
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: `Beta access approved for ${email}` })
      };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
  } catch (err) {
    console.error('Beta access error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
