import pool from '../utils/db.js';
import { logError, logInfo } from '../utils/logger.js';

export const listOrders = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const [orders] = await pool.query(
        `SELECT o.id, o.customer_id, u.name AS customer_name, o.items, o.total_price, o.status, o.created_at, o.updated_at
         FROM orders o
         JOIN users u ON u.id = o.customer_id
         ORDER BY o.created_at DESC`
      );
      logInfo('Admin listed all orders', { adminId: req.user.id });
      return res.json(orders);
    }

    const [orders] = await pool.query(
      `SELECT id, customer_id, items, total_price, status, created_at, updated_at
       FROM orders
       WHERE customer_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    logInfo('Customer listed orders', { customerId: req.user.id });
    return res.json(orders);
  } catch (error) {
    logError('List orders error', error, { userId: req.user?.id });
    return res.status(500).json({ message: 'Unable to fetch orders.' });
  }
};

export const createOrder = async (req, res) => {
  const { items, totalPrice } = req.body;
  if (!Array.isArray(items) || items.length === 0 || !totalPrice) {
    return res.status(400).json({ message: 'Items and total price are required.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO orders (customer_id, items, total_price, status) VALUES (?, ?, ?, ?)',
      [req.user.id, JSON.stringify(items), totalPrice, 'placed']
    );

    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [result.insertId]);
    logInfo('Order created', { customerId: req.user.id, orderId: result.insertId });
    return res.status(201).json(rows[0]);
  } catch (error) {
    logError('Create order error', error, { userId: req.user?.id });
    return res.status(500).json({ message: 'Unable to place order.' });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const { orderId } = req.params;

  if (!['placed', 'preparing', 'ready', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  try {
    await pool.query('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      status,
      orderId
    ]);
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    logInfo('Order status updated', { orderId, status, updatedBy: req.user.id });
    return res.json(rows[0]);
  } catch (error) {
    logError('Update order error', error, { orderId, updatedBy: req.user?.id });
    return res.status(500).json({ message: 'Unable to update order.' });
  }
};

export const getOrder = async (req, res) => {
  const { orderId } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    const order = rows[0];
    if (req.user.role !== 'admin' && order.customer_id !== req.user.id) {
      return res.status(403).json({ message: 'You do not have access to this order.' });
    }
    logInfo('Order retrieved', { orderId, requestedBy: req.user.id });
    return res.json(order);
  } catch (error) {
    logError('Get order error', error, { orderId, requestedBy: req.user?.id });
    return res.status(500).json({ message: 'Unable to fetch order details.' });
  }
};
