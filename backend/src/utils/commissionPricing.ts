const packagePrices: Record<string, number[]> = {
  concept: [80, 240, 600],
  '3d': [150, 450, 900],
  animation: [120, 380, 800]
};

const licenseRates: Record<string, number> = {
  commercial: 0.5,
  merchandising: 2
};

export type CommissionService = 'concept' | '3d' | 'animation';
export type CommissionLicense = 'commercial' | 'merchandising';

export interface CommissionQuote {
  service: CommissionService;
  packageTier: number;
  licenses: CommissionLicense[];
  budget: number;
}

function isCommissionService(value: unknown): value is CommissionService {
  return value === 'concept' || value === '3d' || value === 'animation';
}

function isCommissionLicense(value: unknown): value is CommissionLicense {
  return value === 'commercial' || value === 'merchandising';
}

export function calculateCommissionQuote(service: unknown, tier: unknown, licenses: unknown): CommissionQuote | null {
  if (!isCommissionService(service) || typeof tier !== 'string' || !Array.isArray(licenses)) {
    return null;
  }

  const prices = packagePrices[service];
  const tierIndex = Number(tier);
  if (!prices || !Number.isInteger(tierIndex) || tierIndex < 0 || tierIndex >= prices.length) {
    return null;
  }
  if (!licenses.every(isCommissionLicense)) {
    return null;
  }
  if (new Set(licenses).size !== licenses.length) {
    return null;
  }

  const rate = licenses.reduce((total, license) => total + licenseRates[license], 0);
  return {
    service,
    packageTier: tierIndex,
    licenses,
    budget: prices[tierIndex] * (1 + rate)
  };
}
