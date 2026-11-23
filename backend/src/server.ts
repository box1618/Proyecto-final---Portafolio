import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './conf/dbConnection';
import userRoutes from './routes/user.routes';
import commissionRoutes from './routes/commission.routes';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = Number(process.env.PORT || 3000);
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/users', authRateLimit, userRoutes);
app.use('/api/commissions', commissionRoutes);

async function startServer(): Promise<void> {
  if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error('PORT debe ser un número entre 1 y 65535');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
  }

  await connectDB();
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
}

void startServer().catch((error: unknown) => {
  console.error('No se pudo iniciar el servidor:', error);
  process.exitCode = 1;
});