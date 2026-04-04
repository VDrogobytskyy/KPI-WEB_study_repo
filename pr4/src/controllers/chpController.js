let chpPlants = require('../data/chpData');

// 1. GET /api/chp-plants
exports.getAllPlants = (req, res) => {
  res.json(chpPlants);
};

// 2. GET /api/chp-plants/:id
exports.getPlantById = (req, res) => {
  const plant = chpPlants.find(p => p.id === parseInt(req.params.id));
  if (!plant) return res.status(404).json({ error: 'ТЕЦ не знайдено' });
  res.json(plant);
};

// 3. GET /api/chp-plants/:id/fuel
exports.getFuelData = (req, res) => {
  const plant = chpPlants.find(p => p.id === parseInt(req.params.id));
  if (!plant) return res.status(404).json({ error: 'ТЕЦ не знайдено' });
  res.json({ 
    name: plant.name, 
    fuelType: plant.fuelType, 
    fuelConsumption: plant.fuelConsumption 
  });
};

// 4. GET /api/chp-plants/:id/emissions
exports.getEmissionsData = (req, res) => {
  const plant = chpPlants.find(p => p.id === parseInt(req.params.id));
  if (!plant) return res.status(404).json({ error: 'ТЕЦ не знайдено' });
  res.json({ 
    name: plant.name, 
    emissions: plant.emissions,
    efficiency: plant.efficiency 
  });
};

// 5. POST /api/chp-plants/:id/readings
exports.updateReadings = (req, res) => {
  const plant = chpPlants.find(p => p.id === parseInt(req.params.id));
  if (!plant) return res.status(404).json({ error: 'ТЕЦ не знайдено' });

  const { electricPower, thermalPower, fuelConsumption, emissions } = req.body;
  if (electricPower) plant.electricPower = electricPower;
  if (thermalPower) plant.thermalPower = thermalPower;
  if (fuelConsumption) plant.fuelConsumption = fuelConsumption;
  if (emissions) plant.emissions = emissions;

  res.json({ message: 'Покази оновлено', plant });
};

// 6. PUT /api/chp-plants/:id 
exports.updatePlant = (req, res) => {
  const id = parseInt(req.params.id);
  const index = chpPlants.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'ТЕЦ не знайдено' });

  chpPlants[index] = { id, ...req.body };
  res.json(chpPlants[index]);
};

// 7. DELETE /api/chp-plants/:id 
exports.deletePlant = (req, res) => {
  const id = parseInt(req.params.id);
  const initialLength = chpPlants.length;
  chpPlants = chpPlants.filter(p => p.id !== id);
  
  if (chpPlants.length === initialLength) {
    return res.status(404).json({ error: 'ТЕЦ не знайдено' });
  }
  res.status(204).send();
};