import Purchases from 'react-native-purchases';
import {
  GOOGLE_PLAY_SUBSCRIPTION_BASE_PLAN_ID,
  googlePlayProductIdForPurchase,
} from '../src/billing/googlePlayProductCatalog.js';

/**
 * @param {'tier'|'addon'|'dlc'} kind
 * @param {string} internalProductId tier id, twist_truth, or internal DLC pack id
 */
export async function purchaseViaGooglePlayCatalog(kind, internalProductId) {
  const productId = googlePlayProductIdForPurchase({ kind, productId: internalProductId });
  if (!productId) {
    throw new Error('unknown-product');
  }
  if (kind === 'tier') {
    const products = await Purchases.getProducts(
      [productId],
      Purchases.PRODUCT_CATEGORY.SUBSCRIPTION,
    );
    const product = products?.[0];
    if (!product) throw new Error('product-not-found');
    const options = product.subscriptionOptions || [];
    const basePlan =
      options.find((option) => option.id === GOOGLE_PLAY_SUBSCRIPTION_BASE_PLAN_ID) ||
      product.defaultOption ||
      options[0];
    if (!basePlan) throw new Error('base-plan-not-found');
    await Purchases.purchaseSubscriptionOption(basePlan);
  } else {
    const products = await Purchases.getProducts(
      [productId],
      Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION,
    );
    const product = products?.[0];
    if (!product) throw new Error('product-not-found');
    await Purchases.purchaseStoreProduct(product);
  }
  await Purchases.syncPurchases();
}
