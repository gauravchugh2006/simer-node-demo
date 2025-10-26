import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/orders', label: 'My Orders' }
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg">
            <span className="text-lg font-bold">CCD</span>
          </div>
          <span className="brand-title text-xl font-semibold text-slate-900">Cafe Coffee Day</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-700 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `transition hover:text-brand-600 ${isActive ? 'text-brand-600' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {user ? (
            <>
              {user.role === 'admin' && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `transition hover:text-brand-600 ${isActive ? 'text-brand-600' : ''}`
                  }
                >
                  Admin
                </NavLink>
              )}
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="btn-primary" to="/login">
                Login
              </Link>
              <Link
                className="rounded-full border border-brand-500 px-5 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
                to="/register"
              >
                Join Us
              </Link>
            </>
          )}
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full bg-white p-2 text-slate-700 shadow-md transition hover:bg-brand-50 md:hidden"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg md:hidden">
          <div className="flex flex-col gap-4 text-sm font-semibold text-slate-700">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)}>
                {link.label}
              </NavLink>
            ))}
            {user ? (
              <>
                {user.role === 'admin' && (
                  <NavLink to="/admin" onClick={() => setOpen(false)}>
                    Admin
                  </NavLink>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="text-left text-brand-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="btn-primary" to="/login" onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link
                  className="rounded-full border border-brand-500 px-5 py-2 text-sm font-semibold text-brand-600"
                  to="/register"
                  onClick={() => setOpen(false)}
                >
                  Join Us
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
