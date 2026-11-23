import dotenv from 'dotenv';
import path from 'node:path';
import app from './app';
import { connectDB } from './conf/dbConnection';

dotenv.config({ path: path.resolve(__dirname, '../src/.env') });

const PORT = Number(process.env.PORT || 3000);

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
