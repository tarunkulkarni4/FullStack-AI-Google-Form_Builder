const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

const PLANS = {
    monthly: {
        name: 'NexForm Pro Monthly',
        amount: 19900, // ₹199 in paise
        currency: 'inr',
        interval: 'month',
    },
    yearly: {
        name: 'NexForm Pro Yearly',
        amount: 179900, // ₹1799 in paise
        currency: 'inr',
        interval: 'year',
    },
};

/**
 * POST /api/subscription/create-checkout
 * Creates a Stripe Checkout Session for the selected plan.
 */
const createCheckoutSession = async (req, res) => {
    const { plan, formId, formTitle } = req.body;

    if (!PLANS[plan]) {
        return res.status(400).json({ message: 'Invalid plan. Choose monthly or yearly.' });
    }

    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Get or create Stripe customer
        let customerId = user.subscription?.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
                metadata: { userId: user._id.toString() },
            });
            customerId = customer.id;
            
            // Initialize subscription object if it doesn't exist
            if (!user.subscription) {
                user.subscription = {};
            }
            user.subscription.stripeCustomerId = customerId;
            await user.save();
        }

        const planDetails = PLANS[plan];

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: planDetails.currency,
                    product_data: { name: planDetails.name },
                    unit_amount: planDetails.amount,
                    recurring: { interval: planDetails.interval },
                },
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}${formId ? `&formId=${formId}` : ''}${formTitle ? `&formTitle=${encodeURIComponent(formTitle)}` : ''}`,
            cancel_url: `${process.env.CLIENT_URL}/dashboard?payment=cancelled`,
            metadata: {
                userId: user._id.toString(),
                plan,
            },
        });

        res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
        console.error('Create Checkout Error:', error.message);
        res.status(500).json({ message: 'Failed to create checkout session', error: error.message });
    }
};

/**
 * POST /api/subscription/webhook
 * Handles Stripe webhook events to sync subscription status.
 * Must use raw body (not JSON parsed).
 */
const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata?.userId;
                const plan = session.metadata?.plan;
                const subscriptionId = session.subscription;

                if (userId && subscriptionId) {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    await User.findByIdAndUpdate(userId, {
                        'subscription.plan': plan || 'monthly',
                        'subscription.stripeSubscriptionId': subscriptionId,
                        'subscription.status': 'active',
                        'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
                    });
                }
                break;
            }

            case 'customer.subscription.updated': {
                const sub = event.data.object;
                const customer = await stripe.customers.retrieve(sub.customer);
                const userId = customer.metadata?.userId;
                if (userId) {
                    await User.findByIdAndUpdate(userId, {
                        'subscription.status': sub.status,
                        'subscription.currentPeriodEnd': new Date(sub.current_period_end * 1000),
                    });
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                const customer = await stripe.customers.retrieve(sub.customer);
                const userId = customer.metadata?.userId;
                if (userId) {
                    await User.findByIdAndUpdate(userId, {
                        'subscription.plan': 'free',
                        'subscription.status': 'canceled',
                        'subscription.stripeSubscriptionId': null,
                        'subscription.currentPeriodEnd': null,
                    });
                }
                break;
            }

            default:
                break;
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Webhook handler error:', err.message);
        res.status(500).json({ message: 'Webhook processing error' });
    }
};

/**
 * GET /api/subscription/status
 * Returns the current user's subscription status.
 */
const getSubscriptionStatus = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('subscription email name');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const sub = user.subscription || {};
        const now = new Date();
        const expiry = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
        const isActive = sub.status === 'active' && expiry && expiry > now;
        
        let daysRemaining = 0;
        if (isActive && expiry) {
            daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        }

        res.json({
            isActive,
            plan: sub.plan || 'free',
            status: sub.status || 'none',
            currentPeriodEnd: sub.currentPeriodEnd || null,
            daysRemaining: daysRemaining > 0 ? daysRemaining : 0
        });
    } catch (error) {
        console.error('Get Subscription Status Error:', error.message);
        res.status(500).json({ message: 'Failed to get subscription status' });
    }
};

/**
 * GET /api/subscription/verify-session
 * Manually verifies a Stripe session (useful for local dev without webhooks).
 */
const verifySession = async (req, res) => {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ message: 'Session ID required' });

    try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        console.log('Verifying session:', session.id, 'Status:', session.payment_status);

        if (session.payment_status === 'paid') {
            const subscriptionId = session.subscription;
            const plan = session.metadata?.plan || 'monthly';
            const userId = session.metadata?.userId;

            if (!subscriptionId) {
                console.error('No subscription ID found in session');
                return res.status(400).json({ message: 'No subscription found in session' });
            }

            if (userId === req.userId.toString()) {
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                console.log('Verifying Subscription:', subscription.id, 'Plan:', plan);
                
                let currentPeriodEnd;
                if (subscription.current_period_end) {
                    currentPeriodEnd = new Date(subscription.current_period_end * 1000);
                } else {
                    // Fallback based on plan
                    const days = plan === 'yearly' ? 365 : 30;
                    currentPeriodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
                }

                await User.findByIdAndUpdate(userId, {
                    'subscription.plan': plan,
                    'subscription.stripeSubscriptionId': subscriptionId,
                    'subscription.status': 'active',
                    'subscription.currentPeriodEnd': currentPeriodEnd,
                });

                console.log('User subscription updated successfully');
                return res.json({ success: true, isActive: true });
            }
        }
        res.json({ success: false, isActive: false });
    } catch (error) {
        console.error('Verify Session Error:', error);
        res.status(500).json({ message: 'Verification failed', error: error.message });
    }
};

/**
 * POST /api/subscription/cancel
 * Cancels the user's active Stripe subscription at period end.
 */
const cancelSubscription = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user?.subscription?.stripeSubscriptionId) {
            return res.status(400).json({ message: 'No active subscription found' });
        }

        await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
        });

        res.json({ message: 'Subscription will be cancelled at period end' });
    } catch (error) {
        console.error('Cancel Subscription Error:', error.message);
        res.status(500).json({ message: 'Failed to cancel subscription' });
    }
};

/**
 * POST /api/subscription/debug-reset
 * Resets the user's subscription to free (Development only).
 */
const debugReset = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.userId, {
            'subscription.plan': 'free',
            'subscription.status': 'none',
            'subscription.stripeSubscriptionId': null,
            'subscription.currentPeriodEnd': null,
        });
        res.json({ message: 'Subscription reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Reset failed' });
    }
};

/**
 * GET /api/subscription/history
 * Fetches the user's payment history from Stripe invoices.
 */
const getPaymentHistory = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user?.subscription?.stripeCustomerId) {
            return res.json([]);
        }

        const invoices = await stripe.invoices.list({
            customer: user.subscription.stripeCustomerId,
            limit: 10,
        });

        const history = invoices.data.map(inv => ({
            id: inv.id,
            amount: inv.amount_paid / 100,
            currency: inv.currency.toUpperCase(),
            status: inv.status,
            date: new Date(inv.created * 1000).toLocaleDateString(),
            time: new Date(inv.created * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            email: inv.customer_email,
            phone: inv.customer_phone || 'Not provided',
            pdf: inv.invoice_pdf,
        }));

        res.json(history);
    } catch (error) {
        console.error('History Fetch Error:', error.message);
        res.status(500).json({ message: 'Failed to fetch payment history' });
    }
};

module.exports = { 
    createCheckoutSession, 
    handleWebhook, 
    getSubscriptionStatus, 
    verifySession, 
    cancelSubscription,
    debugReset,
    getPaymentHistory
};
