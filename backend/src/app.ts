import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import userRoutes from './routes/user.routes';
import commissionRoutes from './routes/commission.routes';
import artworkRoutes from './routes/artwork.routes';
import serviceRoutes from './routes/service.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '32kb' }));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/users', userRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/services', serviceRoutes);

export default app;
