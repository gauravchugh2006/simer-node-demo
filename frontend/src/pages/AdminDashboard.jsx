import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import useOrders from '../hooks/useOrders.js';

const orderStatuses = ['placed', 'preparing', 'ready', 'completed', 'cancelled'];

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { orders, loading, error, setOrders } = useOrders(Boolean(token));
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const updateStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      const { data } = await api.patch(`/api/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((order) => (order.id === orderId ? data : order)));
    } catch (err) {
      console.error('Failed to update order', err);
      alert(err.response?.data?.message || 'Unable to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <main className="bg-slate-50 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-10 text-center">
          <h1 className="section-title">Admin control centre</h1>
          <p className="section-subtitle">
            Monitor live orders across all customers and update statuses in real time.
          </p>
        </header>

        {loading && <p className="text-sm text-slate-500">Loading orders...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="mt-6 grid gap-4">
          {orders.map((order) => (
            <div key={order.id} className="card space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Order #{order.id}</p>
                  <p className="text-sm text-slate-500">Customer: {order.customer_name || order.customerId}</p>
                  <p className="text-sm text-slate-500">
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
                <div className="text-right text-sm text-slate-500">
                  <p className="font-semibold text-brand-600">${Number(order.total_price || order.totalPrice).toFixed(2)}</p>
                  <p>Placed {new Date(order.created_at || order.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {orderStatuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => updateStatus(order.id, status)}
                    disabled={updatingId === order.id}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                      order.status === status
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-brand-500 hover:text-brand-600'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!loading && orders.length === 0 && (
            <p className="text-sm text-slate-500">No orders found yet. Encourage customers to place new orders.</p>
          )}
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;
