import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import useOrders from '../hooks/useOrders.js';

const Orders = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [feedback, setFeedback] = useState(null);
  const { orders, loading, error, setOrders } = useOrders(Boolean(token));

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleCreateOrder = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      const parsedItems = items
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((name) => ({ name }));
      const { data } = await api.post('/api/orders', {
        items: parsedItems,
        totalPrice: Number(totalPrice)
      });
      setOrders((prev) => [data, ...prev]);
      setItems('');
      setTotalPrice('');
      setFeedback({ type: 'success', message: 'Order placed successfully!' });
    } catch (err) {
      console.error('Order failed', err);
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Unable to place order.' });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <main className="page-section">
      <div className="mx-auto max-w-5xl px-4">
        <header className="mb-10 text-center">
          <h1 className="section-title">Track your orders</h1>
          <p className="section-subtitle">Stay updated with live statuses and create new orders in seconds.</p>
        </header>

        <section className="card">
          <h2 className="text-xl font-semibold text-primary">Place a quick order</h2>
          <p className="mt-1 text-sm text-muted">Comma separate menu items to create a quick order.</p>
          <form className="mt-4 grid gap-4 md:grid-cols-[2fr,1fr,auto]" onSubmit={handleCreateOrder}>
            <input
              type="text"
              placeholder="Latte, Cocoa Mocha, Spinach Sandwich"
              value={items}
              onChange={(event) => setItems(event.target.value)}
              required
              className="form-input"
            />
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Total ($)"
              value={totalPrice}
              onChange={(event) => setTotalPrice(event.target.value)}
              required
              className="form-input"
            />
            <button className="btn-primary" type="submit">
              Submit
            </button>
          </form>
          {feedback && (
            <p
              className={`mt-3 text-sm ${feedback.type === 'error' ? 'text-red-500' : 'text-accent'}`}
            >
              {feedback.message}
            </p>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-primary">Recent orders</h2>
          {loading && <p className="mt-4 text-sm text-muted">Loading orders...</p>}
          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
          {!loading && orders.length === 0 && (
            <p className="mt-4 text-sm text-muted">No orders yet. Start by placing your first order above.</p>
          )}
          <div className="mt-6 grid gap-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="card flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-primary">Order #{order.id}</p>
                  <p className="text-sm text-muted">
                    {Array.isArray(order.items)
                      ? order.items.map((item) => item.name).join(', ')
                      : (() => {
                          try {
                            return JSON.parse(order.items).map((item) => item.name).join(', ');
                          } catch (e) {
                            return order.items;
                          }
                        })()}
                  </p>
                </div>
                <div className="flex flex-col gap-1 text-sm text-muted md:text-right">
                  <span className="font-semibold text-accent">
                    ${Number(order.total_price || order.totalPrice).toFixed(2)}
                  </span>
                  <span className="capitalize">Status: {order.status}</span>
                  <span>{new Date(order.created_at || order.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Orders;
