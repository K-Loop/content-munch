import { db } from '../db.js';

export interface SelectedAddonInput {
  id: number;
  quantity?: number;
}

export interface PricingBreakdown {
  serviceId: number;
  serviceName: string;
  baseHourlyRate: number;
  durationHours: number;
  basePrice: number;
  addons: Array<{
    id: number;
    name: string;
    priceType: 'flat' | 'per_hour';
    unitPrice: number;
    calculatedPrice: number;
  }>;
  addonsPrice: number;
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  totalPrice: number;
  depositPercentage: number;
  depositAmount: number;
  balanceAtStudio: number;
  currency: string;
}

export function calculateBookingPrice(
  serviceId: number,
  durationHours: number,
  selectedAddonIds: number[] = []
): PricingBreakdown {
  // Fetch service
  const service = db.prepare('SELECT * FROM services WHERE id = ? AND is_active = 1').get(serviceId) as {
    id: number;
    name: string;
    base_hourly_rate: number;
    min_duration_hours: number;
  } | undefined;

  if (!service) {
    throw new Error(`Service with ID ${serviceId} not found or inactive.`);
  }

  // Fetch settings
  const settingsRows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
  const settingsMap = new Map(settingsRows.map(r => [r.key, r.value]));

  const taxPercentage = parseFloat(settingsMap.get('applicable_tax_percentage') || '18');
  const depositPercentage = parseFloat(settingsMap.get('deposit_requirement_percentage') || '0');

  // Enforce minimum duration
  const effectiveDuration = Math.max(durationHours, service.min_duration_hours || 1.0);
  const basePrice = Math.round(service.base_hourly_rate * effectiveDuration);

  // Calculate Addons
  const addonsBreakdown: PricingBreakdown['addons'] = [];
  let addonsPrice = 0;

  if (selectedAddonIds.length > 0) {
    const placeholders = selectedAddonIds.map(() => '?').join(',');
    const addonRows = db.prepare(`SELECT * FROM addons WHERE id IN (${placeholders}) AND is_active = 1`).all(...selectedAddonIds) as Array<{
      id: number;
      name: string;
      price_type: 'flat' | 'per_hour';
      price: number;
    }>;

    for (const addon of addonRows) {
      const calculatedPrice = addon.price_type === 'per_hour' 
        ? Math.round(addon.price * effectiveDuration)
        : Math.round(addon.price);
      
      addonsPrice += calculatedPrice;
      addonsBreakdown.push({
        id: addon.id,
        name: addon.name,
        priceType: addon.price_type,
        unitPrice: addon.price,
        calculatedPrice,
      });
    }
  }

  const subtotal = basePrice + addonsPrice;
  const taxAmount = Math.round((subtotal * taxPercentage) / 100);
  const totalPrice = subtotal + taxAmount;
  const depositAmount = Math.round((totalPrice * depositPercentage) / 100);
  const balanceAtStudio = totalPrice - depositAmount;

  return {
    serviceId: service.id,
    serviceName: service.name,
    baseHourlyRate: service.base_hourly_rate,
    durationHours: effectiveDuration,
    basePrice,
    addons: addonsBreakdown,
    addonsPrice,
    subtotal,
    taxPercentage,
    taxAmount,
    totalPrice,
    depositPercentage,
    depositAmount,
    balanceAtStudio,
    currency: 'INR'
  };
}
