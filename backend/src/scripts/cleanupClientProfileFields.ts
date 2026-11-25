import dotenv from 'dotenv';
import path from 'node:path';
import { connectDB } from '../conf/dbConnection';
import { UserModel } from '../models/User';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function cleanupClientProfileFields(): Promise<void> {
  await connectDB();
  const professionalFields = await UserModel.updateMany(
    {
      role: 'client',
      $or: [
        { artistTitle: { $exists: true } },
        { responseTime: { $exists: true } }
      ]
    },
    {
      $unset: {
        artistTitle: '',
        responseTime: ''
      }
    }
  );
  const legacyHandle = await UserModel.updateMany(
    { role: 'client', handle: 'artfoliostudio' },
    { $unset: { handle: '' } }
  );
  const legacyBio = await UserModel.updateMany(
    {
      role: 'client',
      bio: 'Diseño mundos, personajes y escenas para historias que merecen ser recordadas.'
    },
    { $unset: { bio: '' } }
  );
  const modifiedCount = professionalFields.modifiedCount + legacyHandle.modifiedCount + legacyBio.modifiedCount;
  console.log(`Limpieza de valores antiguos completada. Documentos modificados: ${modifiedCount}.`);
}

void cleanupClientProfileFields()
  .catch((error: unknown) => {
    console.error('No se pudieron limpiar los campos de perfil de cliente:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const mongoose = await import('mongoose');
    await mongoose.disconnect();
  });
