import { Router } from 'express';
import { createOrder, getOrder, listOrders, updateOrderStatus } from '../controllers/orderController.js';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);
router.get('/', listOrders);
router.post('/', createOrder);
router.get('/:orderId', getOrder);
router.patch('/:orderId/status', requireAdmin, updateOrderStatus);

export default router;
