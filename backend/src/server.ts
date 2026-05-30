import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import shipsRouter from './routes/ships';
import contractsRouter from './routes/contracts';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/ships', shipsRouter);
app.use('/api/contracts', contractsRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`SCHT backend running on :${PORT}`);
});
