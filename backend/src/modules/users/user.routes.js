import { Router } from 'express';
import {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  setUserStatus,
} from './user.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantScope } from '../../middleware/tenantScope.js';
import { requirePermission } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate, tenantScope);

router.get('/', requirePermission('users.manage'), getAllUsers);
router.get('/:id', requirePermission('users.manage'), getUser);
router.post('/', requirePermission('users.manage'), createUser);
router.put('/:id', requirePermission('users.manage'), updateUser);
router.patch('/:id/status', requirePermission('users.manage'), setUserStatus);

export default router;
