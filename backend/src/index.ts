import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import meRouter from './routes/me';

const app = express();

app.use(cors({ origin: process.env.ALLOWED_ORIGIN?.split(',') ?? '*' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/me', meRouter);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
