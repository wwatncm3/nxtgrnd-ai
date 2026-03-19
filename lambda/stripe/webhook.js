// Stripe Webhook Handler Lambda
// Processes Stripe events and updates user subscription tier in DynamoDB
//
// Environment Variables:
//   STRIPE_SECRET_KEY - Stripe secret key
//   STRIPE_WEBHOOK_SECRET - Stripe webhook endpoint signing secret
//   USERS_TABLE - DynamoDB table name (default: nxtgrnd-users)
//
// Handled Events:
//   checkout.session.completed - User completed checkout
//   customer.subscription.updated - Subscription changed (upgrade/downgrade/renewal)
//   customer.subscription.deleted - Subscription canceled
//   invoice.payment_failed - Payment failed

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const USERS_TABLE = process.env.USERS_TABLE || 'nxtgrnd-users';

// Update user subscription in DynamoDB
const updateSubscription = async (email, data) => {
  const params = {
    TableName: USERS_TABLE,
    Key: { userId: email },
    UpdateExpression: 'SET subscriptionTier = :tier, stripeCustomerId = :customerId, subscriptionId = :subId, subscriptionStatus = :status, currentPeriodEnd = :periodEnd, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':tier': data.tier,
      ':customerId': data.stripeCustomerId || null,
      ':subId': data.subscriptionId || null,
      ':status': data.subscriptionStatus || null,
      ':periodEnd': data.currentPeriodEnd || null,
      ':updatedAt': new Date().toISOString()
    }
  };

  await docClient.send(new UpdateCommand(params));
};

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  const body = event.body;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid signature' }) };
  }

  console.log('Processing event:', stripeEvent.type);

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        const email = session.client_reference_id || session.customer_email;

        if (!email) {
          console.error('No email found in checkout session');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        await updateSubscription(email, {
          tier: 'pro',
          stripeCustomerId: session.customer,
          subscriptionId: session.subscription,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
        });

        console.log(`Subscription activated for ${email}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);
        const email = customer.email;

        if (!email) break;

        const tier = subscription.status === 'active' ? 'pro' : 'free';

        await updateSubscription(email, {
          tier,
          stripeCustomerId: subscription.customer,
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
        });

        console.log(`Subscription updated for ${email}: ${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);
        const email = customer.email;

        if (!email) break;

        await updateSubscription(email, {
          tier: 'free',
          stripeCustomerId: subscription.customer,
          subscriptionId: subscription.id,
          subscriptionStatus: 'canceled',
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
        });

        console.log(`Subscription canceled for ${email}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object;
        const customer = await stripe.customers.retrieve(invoice.customer);
        const email = customer.email;

        if (!email) break;

        await updateSubscription(email, {
          tier: 'pro', // Keep pro access during grace period
          stripeCustomerId: invoice.customer,
          subscriptionId: invoice.subscription,
          subscriptionStatus: 'past_due',
          currentPeriodEnd: null
        });

        console.log(`Payment failed for ${email}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error('Error processing webhook:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
