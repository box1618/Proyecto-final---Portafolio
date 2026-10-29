//archivo de configuración de la conexión a la base de datos, establece la conexión con MongoDB usando Mongoose
import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const URI = process.env.MONGO_URI;

    if (!URI) {
      throw new Error("La variable de entorno MONGO_URI no está definida");
    }

    const conn = await mongoose.connect(URI);
    console.log(`MongoDB Conectado exitosamente: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error de conexión a MongoDB: ${error}`);
    process.exit(1);
  }
};