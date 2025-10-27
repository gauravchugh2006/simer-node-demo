import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const fields = [
  { name: 'firstName', label: 'First name', type: 'text' },
  { name: 'lastName', label: 'Last name', type: 'text' },
  { name: 'phone', label: 'Phone number', type: 'tel' },
  { name: 'email', label: 'Email', type: 'email', disabled: true },
  { name: 'address', label: 'Primary address', type: 'text' },
  { name: 'city', label: 'City', type: 'text' },
  { name: 'state', label: 'State', type: 'text' },
  { name: 'pinCode', label: 'Pin code', type: 'text' }
];

const Account = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    state: '',
    city: '',
    pinCode: '',
    permanentAddress: '',
    currentAddress: ''
  });
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setForm((prev) => ({
      ...prev,
      firstName: user.firstName || user.firstname || '',
      lastName: user.lastName || user.lastname || '',
      phone: user.phone || '',
      email: user.email || '',
      address: user.address || '',
      state: user.state || '',
      city: user.city || '',
      pinCode: user.pinCode || user.pincode || '',
      permanentAddress: user.permanentAddress || '',
      currentAddress: user.currentAddress || ''
    }));
  }, [user, navigate]);

  const displayName = useMemo(() => {
    const fallback = user?.name || user?.email || 'Your account';
    const name = [form.firstName, form.lastName].filter(Boolean).join(' ').trim();
    return name || fallback;
  }, [form.firstName, form.lastName, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updateProfile(form);
    setStatus('Contact details saved successfully.');
    setTimeout(() => setStatus(null), 4000);
  };

  if (!user) {
    return null;
  }

  return (
    <main className="page-section">
      <div className="mx-auto max-w-5xl px-4">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">Account</p>
          <h1 className="section-title">Welcome, {displayName}</h1>
          <p className="section-subtitle">Update how we reach you across all Cafe Coffee Day experiences.</p>
        </header>

        <form className="card space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name} className="flex flex-col gap-2">
                <label className="form-label" htmlFor={field.name}>
                  {field.label}
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  disabled={field.disabled}
                  value={form[field.name] || ''}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="form-label" htmlFor="permanentAddress">
                Permanent address
              </label>
              <textarea
                id="permanentAddress"
                name="permanentAddress"
                rows="4"
                value={form.permanentAddress}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="form-label" htmlFor="currentAddress">
                Current address
              </label>
              <textarea
                id="currentAddress"
                name="currentAddress"
                rows="4"
                value={form.currentAddress}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          {status && <p className="text-sm text-accent">{status}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              We’ll use these details for receipts, delivery updates, and personalised offers.
            </p>
            <button type="submit" className="btn-primary w-full justify-center sm:w-auto">
              Save changes
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default Account;
