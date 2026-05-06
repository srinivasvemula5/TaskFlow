import { Router } from 'express';
import {
  getProjectTasks, createTask, updateTask,
  updateTaskStatus, deleteTask, getDashboardStats
} from '../controllers/tasks.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', getDashboardStats);
router.get('/project/:id', getProjectTasks);
router.post('/project/:id', createTask);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);

export default router;
