import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import locationsRouter from './routes/locations';
import resourcesRouter from './routes/resources';
import missionsRouter from './routes/missions';
import financeRouter from './routes/finance';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/missions', missionsRouter);
app.use('/api/finance', financeRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`SCHT backend running on :${PORT}`);
});
