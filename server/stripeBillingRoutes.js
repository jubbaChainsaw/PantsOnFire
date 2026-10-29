import Stripe from 'stripe';
import { mergeEntitlementsRow, defaultEntitlements } from './entitlementsRoutes.js';
import { resolveStripePriceId, stripePurchaseToEntitlementPatch } from './stripeCatalog.js';
import { resolveAuthUserFromBearer } from './resolveAuthUser.js';
import { buildBillingCatalog } from './billingCatalog.js';
import { isFirstPaidEntitlementTransition } from './referralEntitlements.js';

function getStripe() {
  const key = String(process.env.STRIPE_SECRET_KEY || '').trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2024-11-20.acacia' });
}

async function verifyBillingUser(req) {
  const resolved = await resolveAuthUserFromBearer(req);
  if (resolved.error) return { error: resolved.error };
  return { userId: resolved.userId };
}

function checkoutUrls() {
  const success =
    String(process.env.STRIPE_CHECKOUT_SUCCESS_URL || '').trim() ||
    'https://www.pantsonfire.app/?pofScreen=store&checkout=success';
  const cancel =
    String(process.env.STRIPE_CHECKOUT_CANCEL_URL || '').trim() ||
    'https://www.pantsonfire.app/?pofScreen=store&checkout=cancel';
  return { success, cancel };
}

export function mountStripeBillingRoutes(app, { store, referralHooks } = {}) {
  const entitlementStore = store || new Map();
  const simulate = String(process.env.POF_BILLING_SIMULATE || '').trim() === '1';

  app.get('/api/billing/catalog', async (_req, res) => {
    try {
      const catalog = await buildBillingCatalog();
      res.json(catalog);
    } catch (err) {
      res.status(500).json({ error: 'catalog-failed', detail: String(err?.message || err) });
    }
  });

  app.post('/api/billing/stripe/checkout-session', async (req, res) => {
    const stripe = getStripe();
    if (!stripe) {
      res.status(503).json({ error: 'stripe-not-configured' });
      return;
    }
    const auth = await verifyBillingUser(req);
    if (auth.error) {
      res.status(auth.error === 'missing-token' ? 401 : 503).json({ error: auth.error });
      return;
    }
    const kind = String(req.body?.kind || '').trim();
    const productId = String(req.body?.productId || '').trim();
    const priceId = resolveStripePriceId(kind, productId);
    if (!kind || !productId || !priceId) {
      res.status(400).json({ error: 'invalid-product' });
      return;
    }
    const { success, cancel } = checkoutUrls();
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: success,
        cancel_url: cancel,
        client_reference_id: auth.userId,
        metadata: {
          userId: auth.userId,
          kind,
          productId,
        },
      });
      res.json({ url: session.url, sessionId: session.id });
    } catch (err) {
      res.status(500).json({ error: 'stripe-session-failed', detail: String(err?.message || err) });
    }
  });

  if (simulate) {
    app.post('/api/billing/simulate-purchase', async (req, res) => {
      const kind = String(req.body?.kind || '').trim();
      const productId = String(req.body?.productId || '').trim();
      const userId = String(req.body?.userId || '').trim();
      if (!userId || !kind || !productId) {
        res.status(400).json({ error: 'invalid-body' });
        return;
      }
      const patch = stripePurchaseToEntitlementPatch(kind, productId);
      if (!patch) {
        res.status(400).json({ error: 'invalid-product' });
        return;
      }
      const prev = await Promise.resolve(entitlementStore.get(userId));
      const next = mergeEntitlementsRow(
        prev ? mergeEntitlementsRow(defaultEntitlements(), prev) : defaultEntitlements(),
        patch,
      );
      await Promise.resolve(entitlementStore.set(userId, next));
      if (
        referralHooks?.onInviteeFirstPaidPurchase &&
        isFirstPaidEntitlementTransition(prev, next)
      ) {
        await referralHooks.onInviteeFirstPaidPurchase(userId, 'stripe-simulate');
      }
      res.json({
        ok: true,
        entitlements: {
          tierId: next.tierId,
          addonTwistTruth: next.addonTwistTruth,
          unlockedThemePackIds: next.unlockedThemePackIds,
        },
      });
    });

    app.get('/api/billing/dev/entitlements/:userId', async (req, res) => {
      const userId = String(req.params.userId || '').trim();
      if (!userId) {
        res.status(400).json({ error: 'missing-user-id' });
        return;
      }
      const stored = await Promise.resolve(entitlementStore.get(userId));
      const row = stored
        ? mergeEntitlementsRow(defaultEntitlements(), stored)
        : defaultEntitlements();
      res.json({
        tierId: row.tierId,
        addonTwistTruth: row.addonTwistTruth,
        unlockedThemePackIds: row.unlockedThemePackIds,
      });
    });
  }
}

export function mountStripeWebhook(app, { store, referralHooks } = {}) {
  const entitlementStore = store || new Map();
  const stripe = getStripe();
  const webhookSecret = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();

  app.post(
    '/api/billing/stripe/webhook',
    expressRawJson,
    async (req, res) => {
      if (!stripe || !webhookSecret) {
        res.status(503).send('stripe-webhook-not-configured');
        return;
      }
      const sig = req.headers['stripe-signature'];
      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId =
          String(session.metadata?.userId || session.client_reference_id || '').trim();
        const kind = String(session.metadata?.kind || '').trim();
        const productId = String(session.metadata?.productId || '').trim();
        if (userId && kind && productId) {
          const patch = stripePurchaseToEntitlementPatch(kind, productId);
          if (patch) {
            const prev = await Promise.resolve(entitlementStore.get(userId));
            const next = mergeEntitlementsRow(
              prev ? mergeEntitlementsRow(defaultEntitlements(), prev) : defaultEntitlements(),
              patch,
            );
            await Promise.resolve(entitlementStore.set(userId, next));
            if (
              referralHooks?.onInviteeFirstPaidPurchase &&
              isFirstPaidEntitlementTransition(prev, next)
            ) {
              await referralHooks.onInviteeFirstPaidPurchase(userId, 'stripe');
            }
          }
        }
      }
      res.json({ received: true });
    },
  );
}

function expressRawJson(req, res, next) {
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    req.body = Buffer.concat(chunks);
    next();
  });
}
