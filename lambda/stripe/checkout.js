// Stripe Checkout Session Creator Lambda
// Creates a Stripe Checkout session for NxtGrnd Pro subscription
//
// Environment Variables:
//   STRIPE_SECRET_KEY        - Stripe secret key (sk_live_xxx or sk_test_xxx)
//   STRIPE_PRICE_ID          - Stripe Price ID for NxtGrnd Pro (price_xxx)
//   APP_URL                  - Frontend URL (e.g. https://app.nxtgrnd.ai)
//   USERS_TABLE              - DynamoDB table (default: nxtgrnd-users)
//
// Request Body:
//   { userId: "user@email.com" }
//
// Response:
//   { url: "https://checkout.stripe.com/pay/..." }

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.USERS_TABLE || 'nxtgrnd-users';
const PRICE_ID    = process.env.STRIPE_PRICE_ID;   // price_xxx from Stripe dashboard
const APP_URL     = process.env.APP_URL || 'https://app.nxtgrnd.ai';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (!PRICE_ID) {
      console.error('STRIPE_PRICE_ID environment variable is not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Stripe price not configured' })
      };
    }

    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { userId } = body;

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'userId is required' })
      };
    }

    // Check if user already has a Stripe customer ID
    let stripeCustomerId = null;
    try {
      const result = await docClient.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId }
      }));
      stripeCustomerId = result.Item?.stripeCustomerId || null;
    } catch (err) {
      console.warn('Could not look up existing customer, will create new:', err.message);
    }

    // Build session params
    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      client_reference_id: userId,   // used by webhook to link back to user
      customer_email: stripeCustomerId ? undefined : userId, // pre-fill email if no customer yet
      customer: stripeCustomerId || undefined,               // reuse existing Stripe customer
      success_url: `${APP_URL}?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/pricing?upgrade=canceled`,
      metadata: { userId }
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log(`Checkout session created for ${userId}: ${session.id}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url, sessionId: session.id })
    };
  } catch (err) {
    console.error('Error creating checkout session:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create checkout session' })
    };
  }
};
