import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import userRoutes from './routes/user.routes';
import commissionRoutes from './routes/commission.routes';
import artworkRoutes from './routes/artwork.routes';

const app = express();
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
app.use('/api/artworks', artworkRoutes);

export default app;
