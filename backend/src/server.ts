import express from 'express';
import cors from 'cors';
import { connectDB } from './conf/dbConnection';
import userRoutes from './routes/user.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/users', userRoutes);

// Middlewares
app.use(express.json());
app.use(cors());

// Conectar Base de Datos
connectDB();

// Rutas de la API
app.use('/api/users', userRoutes);

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});