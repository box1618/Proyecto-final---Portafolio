import dotenv from 'dotenv';
import path from 'node:path';
import { connectDB } from '../conf/dbConnection';
import { ServiceListingModel } from '../models/ServiceListing';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const initialServices = [
  {
    slug: 'concept-art',
    category: 'Concept Art',
    title: 'Concept art cinematográfico',
    description: 'Diseño de entornos y atmósferas para cine, videojuegos y portadas.',
    rules: [
      'Comparte una descripción de la idea y las referencias disponibles.',
      'El uso comercial debe acordarse antes de iniciar el trabajo.'
    ],
    images: ['/images/cat.jpg'],
    packages: [
      { name: 'Boceto', description: 'Para explorar una idea.', price: 80, deliveryDays: 3, included: '1 thumbnail a color y 1 revisión' },
      { name: 'Estándar', description: 'Entorno completo con color y luz.', price: 240, deliveryDays: 7, included: 'Escena completa, 2 revisiones y PSD' },
      { name: 'Premium', description: 'Para proyectos de estudio y publicación.', price: 600, deliveryDays: 14, included: 'Escena 4K, 3 revisiones y PSD 16-bit' }
    ],
    active: true,
    displayOrder: 1
  },
  {
    slug: 'dibujo-renderizado',
    category: 'Dibujo renderizado',
    title: 'Ilustración digital con acabado renderizado',
    description: 'Personajes, criaturas y escenas con color, iluminación y acabado detallado.',
    rules: [
      'Comparte referencias visuales y el uso previsto de la obra.',
      'El uso comercial debe acordarse antes de iniciar el trabajo.'
    ],
    images: ['/images/cat.jpg'],
    packages: [
      { name: 'Boceto', description: 'Un boceto de personaje u objeto.', price: 150, deliveryDays: 5, included: 'Boceto definido y 1 revisión' },
      { name: 'Ilustración', description: 'Una ilustración a color con acabado renderizado.', price: 450, deliveryDays: 12, included: 'Personaje a color y 2 revisiones' },
      { name: 'Completa', description: 'Una ilustración completa con fondo y detalles.', price: 900, deliveryDays: 20, included: 'Escena detallada, 3 revisiones y archivo final' }
    ],
    active: true,
    displayOrder: 2
  },
  {
    slug: 'animacion-2d',
    category: 'Animación 2D',
    title: 'Animación 2D y motion',
    description: 'Loops, secuencias de acción y piezas promocionales dibujadas a mano.',
    rules: [
      'Indica la duración y formato deseados en tu solicitud.',
      'El uso comercial debe acordarse antes de iniciar el trabajo.'
    ],
    images: ['/images/cat.jpg'],
    packages: [
      { name: 'Loop', description: 'Perfecto para redes y avatares.', price: 120, deliveryDays: 4, included: 'Loop de 3 s, 1 revisión, GIF y MP4' },
      { name: 'Secuencia', description: 'Combate, personaje o escena corta.', price: 380, deliveryDays: 10, included: 'Hasta 8 s, 2 revisiones, MP4 HD' },
      { name: 'Pieza', description: 'Teaser o pieza promocional completa.', price: 800, deliveryDays: 18, included: 'Hasta 20 s, sonido básico, 3 revisiones y MP4 4K' }
    ],
    active: true,
    displayOrder: 3
  }
];

async function seedInitialServices(): Promise<void> {
  await connectDB();
  let insertedCount = 0;
  for (const service of initialServices) {
    const result = await ServiceListingModel.updateOne(
      { slug: service.slug },
      { $setOnInsert: service },
      { upsert: true }
    );
    if (result.upsertedCount) insertedCount += 1;
  }
  console.log(`Servicios iniciales agregados: ${insertedCount}. Los servicios existentes se conservaron.`);
}

void seedInitialServices()
  .catch((error: unknown) => {
    console.error('No se pudieron inicializar los servicios:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const mongoose = await import('mongoose');
    await mongoose.disconnect();
  });
