//archivo principal del servidor, configura y arranca el servidor Express
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './conf/dbConnection';
import userRoutes from './routes/user.routes';

//variable de entorno para el puerto del servidor
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/users', userRoutes);

// Middlewares
app.use(express.json());
app.use(cors());

// conectar Base de Datos
connectDB();

// rutas de la API
app.use('/api/users', userRoutes);

// arrancar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});