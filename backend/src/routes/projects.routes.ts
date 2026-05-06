import { Router } from 'express';
import {
  getProjects, createProject, getProject,
  updateProject, deleteProject, addMember, removeMember
} from '../controllers/projects.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

export default router;
