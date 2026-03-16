import { Router } from 'express';
import authRouter from './auth';
import storiesRouter from './stories';

const router = Router();

router.use('/auth', authRouter);
router.use('/stories', storiesRouter);

export default router;
