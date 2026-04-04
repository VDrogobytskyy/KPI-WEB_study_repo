const express = require('express');
const chpRoutes = require('./src/routes/chpRoutes');

const app = express();
const PORT = 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api/chp-plants', chpRoutes);

app.listen(PORT, () => {
  console.log(`Сервер ТЕЦ запущено: http://localhost:${PORT}`);
});