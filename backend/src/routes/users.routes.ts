import { Router } from 'express';
import { getAllUsers } from '../controllers/users.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.get('/', getAllUsers);

export default router;
