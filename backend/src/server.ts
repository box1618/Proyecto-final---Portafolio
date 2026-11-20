//archivo principal del servidor, configura y arranca el servidor Express
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { connectDB } from './conf/dbConnection';
import userRoutes from './routes/user.routes';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});