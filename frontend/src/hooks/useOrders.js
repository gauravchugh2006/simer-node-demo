import { useEffect, useState } from 'react';
import api from '../services/api.js';

const useOrders = (enabled = true) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    api
      .get('/api/orders')
      .then((response) => setOrders(response.data))
      .catch((err) => {
        console.error('Failed to fetch orders', err);
        setError('Unable to load orders.');
      })
      .finally(() => setLoading(false));
  }, [enabled]);

  return { orders, loading, error, setOrders };
};

export default useOrders;
