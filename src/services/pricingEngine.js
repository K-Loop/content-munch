// Pure frontend pricing calculation engine

import { getStoredServices, getStoredAddons, getStoredSettings } from './storageService.js';

export function calculateBookingPrice(
  serviceId,
  durationHours = 1,
  selectedAddonIds = [],
  customServices = null,
  customAddons = null,
  customSettings = null
) {
  const services = customServices || getStoredServices();
  const addons = customAddons || getStoredAddons();
  const settingsList = customSettings || getStoredSettings();

  const settingsMap = new Map();
  if (Array.isArray(settingsList)) {
    for (const item of settingsList) {
      settingsMap.set(item.key, item.value);
    }
  } else if (typeof settingsList === 'object' && settingsList !== null) {
    for (const [k, v] of Object.entries(settingsList)) {
      settingsMap.set(k, v);
    }
  }

  const service = services.find(s => Number(s.id) === Number(serviceId) && s.is_active);
  if (!service) {
    throw new Error(`Service with ID ${serviceId} not found or inactive.`);
  }

  const taxPercentage = parseFloat(settingsMap.get('applicable_tax_percentage') || '18');
  const depositPercentage = parseFloat(settingsMap.get('deposit_requirement_percentage') || '0');

  // Enforce minimum duration
  const effectiveDuration = Math.max(Number(durationHours) || 1, service.min_duration_hours || 1.0);
  const basePrice = Math.round(service.base_hourly_rate * effectiveDuration);

  // Calculate Add-ons
  const addonsBreakdown = [];
  let addonsPrice = 0;

  if (Array.isArray(selectedAddonIds) && selectedAddonIds.length > 0) {
    const selectedSet = new Set(selectedAddonIds.map(Number));
    const activeAddons = addons.filter(a => selectedSet.has(Number(a.id)) && a.is_active);

    for (const addon of activeAddons) {
      const calculatedPrice = addon.price_type === 'per_hour'
        ? Math.round(addon.price * effectiveDuration)
        : Math.round(addon.price);

      addonsPrice += calculatedPrice;
      addonsBreakdown.push({
        id: addon.id,
        name: addon.name,
        priceType: addon.price_type,
        unitPrice: addon.price,
        calculatedPrice
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
