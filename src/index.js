import express from 'express';
import cors from 'cors';
import astrologyRoutes from './routes/api.js'; 


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: 'https://astromatchup.netlify.app', // Cambia al origen de tu frontend
  methods: ['GET', 'POST'], // Métodos permitidos
  allowedHeaders: ['Content-Type'], // Headers permitidos
}));

app.use(express.json());

// Routes
app.use('/api', astrologyRoutes); // Montar rutas en "/api"

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
