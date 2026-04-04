const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'plants.json');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const readData = () => {
    if (!fs.existsSync(DATA_FILE)) return [];
    try {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(content || '[]');
    } catch (e) { return []; }
};

const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

app.get('/api/plants', (req, res) => {
    const plants = readData();
    res.json(plants);
});

app.post('/api/plants', (req, res) => {
    const { company, edrpou, type, power, license } = req.body;
    const plants = readData();

    const edrpouRegex = /^\d{8}$/;
    if (!edrpouRegex.test(edrpou)) {
        return res.status(400).json({ message: 'ЄДРПОУ повинен містити 8 цифр!' });
    }

    if (plants.find(p => p.edrpou === edrpou)) {
        return res.status(400).json({ message: 'Цей ЄДРПОУ вже зареєстровано!' });
    }

    const newPlant = {
        id: Date.now(),
        company,
        edrpou,
        type,
        power: parseFloat(power),
        license,
        date: new Date().toLocaleString('uk-UA') 
    };

    plants.push(newPlant);
    writeData(plants);
    res.status(201).json({ message: 'Об’єкт успішно додано!', plant: newPlant });
});

app.listen(PORT, () => {
    console.log(`Сервер: http://localhost:${PORT}`);
});