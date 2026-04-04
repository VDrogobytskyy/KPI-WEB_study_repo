const FUEL_TYPES = new Set(['gas', 'coal', 'biomass']);
const STATUSES = new Set(['active', 'standby', 'maintenance']);
const REQUIRED_FIELDS = ['name', 'electricPower', 'thermalPower', 'fuelType', 'status'];

const validatePlant = (data, isPartial = false) => {
  if (!isPartial) {
    for (const field of REQUIRED_FIELDS) {
      if (data[field] === undefined) return `Missing required field: ${field}`;
    }
  }

  if (data.fuelType && !FUEL_TYPES.has(data.fuelType)) {
    return `Invalid fuelType. Allowed: ${Array.from(FUEL_TYPES).join(', ')}`;
  }

  if (data.status && !STATUSES.has(data.status)) {
    return `Invalid status. Allowed: ${Array.from(STATUSES).join(', ')}`;
  }

  if (data.efficiency && (data.efficiency < 0 || data.efficiency > 100)) {
    return 'Efficiency must be between 0 and 100';
  }

  return null;
};

module.exports = { validatePlant };