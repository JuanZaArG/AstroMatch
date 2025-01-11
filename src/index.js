const express = require('express');
const cors = require('cors');
const astrologyRoutes = require('./routes/api');
const app = express();
const PORT = 3000;

const astronomyEngine = require('astronomy-engine');

// Middleware
app.use(cors()); // Permitir conexiones desde el frontend
app.use(express.json());

// Rutas
app.use('/api', astrologyRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
