import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/register', form);
      login(data);
      navigate('/');
    } catch (err) {
      console.error('Registration failed', err);
      setError(err.response?.data?.message || 'Unable to register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-section flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-semibold text-primary">Join Cafe Coffee Day</h1>
        <p className="mt-2 text-sm text-muted">Create your account to unlock exclusive rewards and faster ordering.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="form-label" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              className="form-input mt-1"
            />
          </div>
          <div>
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="form-input mt-1"
            />
          </div>
          <div>
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              className="form-input mt-1"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button className="btn-primary w-full" disabled={loading} type="submit">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Register;
