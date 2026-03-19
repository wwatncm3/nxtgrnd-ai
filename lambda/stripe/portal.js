// Stripe Customer Portal Lambda
// Creates a Stripe Customer Portal session for subscription management
//
// Environment Variables:
//   STRIPE_SECRET_KEY - Stripe secret key
//   USERS_TABLE - DynamoDB table name (default: nxtgrnd-users)
//   APP_URL - Frontend app URL for return redirect
//
// Request Body:
//   { userId: "user@email.com" }
//
// Response:
//   { url: "https://billing.stripe.com/session/..." }

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const USERS_TABLE = process.env.USERS_TABLE || 'nxtgrnd-users';
const APP_URL = process.env.APP_URL || 'https://app.nxtgrnd.ai';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { userId } = body;

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'userId is required' })
      };
    }

    // Look up Stripe customer ID from DynamoDB
    const result = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId }
    }));

    const stripeCustomerId = result.Item?.stripeCustomerId;

    if (!stripeCustomerId) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No subscription found for this user' })
      };
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: APP_URL
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    console.error('Error creating portal session:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create portal session' })
    };
  }
};
