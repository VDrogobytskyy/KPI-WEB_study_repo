const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const FUEL_TYPES = new Set(['gas', 'coal', 'biomass']);
const STATUSES = new Set(['active', 'standby', 'maintenance']);

const REQUIRED_FIELDS = [
  'name',
  'electricPower',
  'thermalPower',
  'fuelType',
  'fuelConsumption',
  'efficiency',
  'emissions',
  'steamPressure',
  'status'
];

const READINGS_FIELDS = new Set([
  'electricPower',
  'thermalPower',
  'fuelConsumption',
  'efficiency',
  'emissions',
  'steamPressure'
]);

let chpPlants = [
  {
    id: 1,
    name: 'Київська ТЕЦ-5',
    electricPower: 700,
    thermalPower: 1874,
    fuelType: 'gas',
    fuelConsumption: 9500,
    efficiency: 88,
    emissions: 25,
    steamPressure: 13.0,
    status: 'active'
  },
  {
    id: 2,
    name: 'Київська ТЕЦ-6',
    electricPower: 500,
    thermalPower: 1500,
    fuelType: 'gas',
    fuelConsumption: 8200,
    efficiency: 87,
    emissions: 23,
    steamPressure: 12.5,
    status: 'active'
  },
  {
    id: 3,
    name: 'Харківська ТЕЦ-5',
    electricPower: 540,
    thermalPower: 1420,
    fuelType: 'gas',
    fuelConsumption: 8700,
    efficiency: 86,
    emissions: 24,
    steamPressure: 12.0,
    status: 'active'
  },
  {
    id: 4,
    name: 'Кременчуцька ТЕЦ',
    electricPower: 255,
    thermalPower: 815,
    fuelType: 'gas',
    fuelConsumption: 4200,
    efficiency: 84,
    emissions: 20,
    steamPressure: 10.5,
    status: 'active'
  },
  {
    id: 5,
    name: 'Черкаська ТЕЦ',
    electricPower: 200,
    thermalPower: 700,
    fuelType: 'coal',
    fuelConsumption: 5000,
    efficiency: 80,
    emissions: 35,
    steamPressure: 9.8,
    status: 'active'
  },
  {
    id: 6,
    name: 'Львівська ТЕЦ-1',
    electricPower: 68,
    thermalPower: 340,
    fuelType: 'gas',
    fuelConsumption: 1800,
    efficiency: 82,
    emissions: 18,
    steamPressure: 8.5,
    status: 'active'
  },
  {
    id: 7,
    name: 'Одеська ТЕЦ',
    electricPower: 68,
    thermalPower: 505,
    fuelType: 'gas',
    fuelConsumption: 2000,
    efficiency: 83,
    emissions: 19,
    steamPressure: 9.0,
    status: 'active'
  },
  {
    id: 8,
    name: 'Dnipro CHP Plant',
    electricPower: 300,
    thermalPower: 900,
    fuelType: 'coal',
    fuelConsumption: 6200,
    efficiency: 78,
    emissions: 40,
    steamPressure: 11.0,
    status: 'active'
  },
  {
    id: 9,
    name: 'Berlin HKW Mitte',
    electricPower: 435,
    thermalPower: 398,
    fuelType: 'gas',
    fuelConsumption: 7000,
    efficiency: 90,
    emissions: 15,
    steamPressure: 13.5,
    status: 'active'
  },
  {
    id: 10,
    name: 'Warsaw CHP Siekierki',
    electricPower: 620,
    thermalPower: 2078,
    fuelType: 'coal',
    fuelConsumption: 11000,
    efficiency: 81,
    emissions: 38,
    steamPressure: 13.0,
    status: 'active'
  },
  {
    id: 11,
    name: 'Prague CHP Malešice',
    electricPower: 150,
    thermalPower: 500,
    fuelType: 'gas',
    fuelConsumption: 3500,
    efficiency: 86,
    emissions: 17,
    steamPressure: 10.0,
    status: 'active'
  },
  {
    id: 12,
    name: 'Vienna Simmering CHP',
    electricPower: 700,
    thermalPower: 900,
    fuelType: 'gas',
    fuelConsumption: 9200,
    efficiency: 91,
    emissions: 14,
    steamPressure: 14.0,
    status: 'active'
  },
  {
    id: 13,
    name: 'Stockholm Värtaverket',
    electricPower: 130,
    thermalPower: 550,
    fuelType: 'biomass',
    fuelConsumption: 4000,
    efficiency: 89,
    emissions: 10,
    steamPressure: 11.5,
    status: 'active'
  },
  {
    id: 14,
    name: 'Helsinki CHP Vuosaari',
    electricPower: 630,
    thermalPower: 600,
    fuelType: 'gas',
    fuelConsumption: 8800,
    efficiency: 92,
    emissions: 13,
    steamPressure: 14.5,
    status: 'active'
  },
  {
    id: 15,
    name: 'Copenhagen Amager Bakke',
    electricPower: 63,
    thermalPower: 247,
    fuelType: 'waste',
    fuelConsumption: 1500,
    efficiency: 87,
    emissions: 12,
    steamPressure: 9.0,
    status: 'active'
  }
];

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

const FIELD_VALIDATORS = {
  name: value =>
    typeof value === 'string' && value.trim() !== ''
      ? null
      : 'Field "name" must be a non-empty string.',
  electricPower: value =>
    isNumber(value) ? null : 'Field "electricPower" must be a number.',
  thermalPower: value =>
    isNumber(value) ? null : 'Field "thermalPower" must be a number.',
  fuelType: value =>
    FUEL_TYPES.has(value)
      ? null
      : 'Field "fuelType" must be one of: gas, coal, biomass.',
  fuelConsumption: value =>
    isNumber(value) ? null : 'Field "fuelConsumption" must be a number.',
  efficiency: value =>
    isNumber(value) ? null : 'Field "efficiency" must be a number.',
  emissions: value =>
    isNumber(value) ? null : 'Field "emissions" must be a number.',
  steamPressure: value =>
    isNumber(value) ? null : 'Field "steamPressure" must be a number.',
  status: value =>
    STATUSES.has(value)
      ? null
      : 'Field "status" must be one of: active, standby, maintenance.'
};

function validatePlant(data, { partial = false } = {}) {
  if (!data || typeof data !== 'object') {
    return 'Body must be a JSON object.';
  }

  if (!partial) {
    for (const field of REQUIRED_FIELDS) {
      if (!(field in data)) {
        return `Missing required field: ${field}`;
      }
    }
  }

  for (const [field, validator] of Object.entries(FIELD_VALIDATORS)) {
    if (field in data) {
      const error = validator(data[field]);
      if (error) {
        return error;
      }
    }
  }

  return null;
}

function getId(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) ? id : null;
}

function getPlantOrRespond(req, res) {
  const id = getId(req);
  if (id === null) {
    res.status(400).json({ error: 'Invalid id.' });
    return null;
  }

  const plant = chpPlants.find(p => p.id === id);
  if (!plant) {
    res.status(404).json({ error: 'CHP plant not found.' });
    return null;
  }

  return plant;
}

app.get('/api/chp-plants', (req, res) => {
  res.json(chpPlants);
});

app.get('/api/chp-plants/:id', (req, res) => {
  const plant = getPlantOrRespond(req, res);
  if (!plant) {
    return;
  }

  res.json(plant);
});

app.get('/api/chp-plants/:id/fuel', (req, res) => {
  const plant = getPlantOrRespond(req, res);
  if (!plant) {
    return;
  }

  res.json({
    id: plant.id,
    fuelType: plant.fuelType,
    fuelConsumption: plant.fuelConsumption
  });
});

app.get('/api/chp-plants/:id/emissions', (req, res) => {
  const plant = getPlantOrRespond(req, res);
  if (!plant) {
    return;
  }

  res.json({
    id: plant.id,
    emissions: plant.emissions
  });
});

app.post('/api/chp-plants/:id/readings', (req, res) => {
  const plant = getPlantOrRespond(req, res);
  if (!plant) {
    return;
  }

  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Body must be a JSON object.' });
  }

  const keys = Object.keys(updates);
  if (keys.length === 0) {
    return res.status(400).json({ error: 'No readings provided.' });
  }

  for (const key of keys) {
    if (!READINGS_FIELDS.has(key)) {
      return res.status(400).json({ error: `Invalid readings field: ${key}` });
    }
  }

  const validationError = validatePlant(updates, { partial: true });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  Object.assign(plant, updates, { lastUpdated: new Date().toISOString() });
  res.json(plant);
});

app.put('/api/chp-plants/:id', (req, res) => {
  const id = getId(req);
  if (id === null) {
    return res.status(400).json({ error: 'Invalid id.' });
  }

  const plantIndex = chpPlants.findIndex(p => p.id === id);
  if (plantIndex === -1) {
    return res.status(404).json({ error: 'CHP plant not found.' });
  }

  const validationError = validatePlant(req.body, { partial: false });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const updated = { id, ...req.body };
  chpPlants[plantIndex] = updated;
  res.json(updated);
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
