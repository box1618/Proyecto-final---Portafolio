import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    // Pega tu cadena aquí, cambia <db_password> por tu contraseña real y añade artfolio_db
    const URI = 'mongodb+srv://fatimaavilamen_db_user:qbhVU7zk82544@cluster0.zqzwmep.mongodb.net/artfolio_db?retryWrites=true&w=majority';
    
    const conn = await mongoose.connect(URI);
    console.log(`MongoDB Conectado exitosamente: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error de conexión a MongoDB: ${error}`);
    process.exit(1);
  }
};