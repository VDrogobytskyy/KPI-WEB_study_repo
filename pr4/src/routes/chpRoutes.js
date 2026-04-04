const express = require('express');
const router = express.Router();
const chpController = require('../controllers/chpController');

router.get('/', chpController.getAllPlants);
router.get('/:id', chpController.getPlantById);
router.get('/:id/fuel', chpController.getFuelData);
router.get('/:id/emissions', chpController.getEmissionsData);
router.post('/:id/readings', chpController.updateReadings);
router.put('/:id', chpController.updatePlant);
router.delete('/:id', chpController.deletePlant);

module.exports = router;