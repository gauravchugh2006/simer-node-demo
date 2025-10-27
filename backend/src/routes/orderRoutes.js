import { Router } from 'express';
import { createOrder, getOrder, listOrders, updateOrderStatus } from '../controllers/orderController.js';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/orders:
 *   get:
 *     summary: Retrieve orders for the current user
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of orders
 *       '401':
 *         description: Authentication required
 */
router.get('/', listOrders);

/**
 * @openapi
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - totalPrice
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               totalPrice:
 *                 type: number
 *     responses:
 *       '201':
 *         description: Order created
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Authentication required
 */
router.post('/', createOrder);

/**
 * @openapi
 * /api/orders/{orderId}:
 *   get:
 *     summary: Retrieve a specific order
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Order details
 *       '401':
 *         description: Authentication required
 *       '403':
 *         description: Forbidden for this user
 *       '404':
 *         description: Order not found
 */
router.get('/:orderId', getOrder);

/**
 * @openapi
 * /api/orders/{orderId}/status:
 *   patch:
 *     summary: Update an order status
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [placed, preparing, ready, completed, cancelled]
 *     responses:
 *       '200':
 *         description: Updated order
 *       '400':
 *         description: Invalid status
 *       '401':
 *         description: Authentication required
 *       '403':
 *         description: Admin access required
 *       '404':
 *         description: Order not found
 */
router.patch('/:orderId/status', requireAdmin, updateOrderStatus);

export default router;
