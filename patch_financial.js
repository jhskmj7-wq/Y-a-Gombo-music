const fs = require('fs');
let code = fs.readFileSync('src/lib/financial.ts', 'utf8');

// Replace the rate logic
code = code.replace(
  /\/\/ Global in-memory cache for platform fee rate.*?export function getPlatformFeeRate\(\): number \{[^\}]+\}/s,
`// Global in-memory cache for platform pricing configuration
export interface PricingConfig {
  standardCommissionRate: number; // e.g. 0.05
  premiumCommissionRate: number; // e.g. 0.02
}

let currentPricing: PricingConfig = {
  standardCommissionRate: 0.025,
  premiumCommissionRate: 0.015
};

/**
 * Fetch configured platform pricing from Firestore configs/pricing document.
 */
export async function fetchPlatformPricing(): Promise<PricingConfig> {
  try {
    const snap = await getDoc(doc(db, "configs", "pricing"));
    if (snap.exists()) {
      const data = snap.data();
      if (typeof data?.standardCommissionRate === "number") {
        currentPricing.standardCommissionRate = data.standardCommissionRate;
      }
      if (typeof data?.premiumCommissionRate === "number") {
        currentPricing.premiumCommissionRate = data.premiumCommissionRate;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch platform pricing, using fallback:", err);
  }
  return currentPricing;
}

export function getPlatformPricing(): PricingConfig {
  return currentPricing;
}`
);

fs.writeFileSync('src/lib/financial.ts', code);
