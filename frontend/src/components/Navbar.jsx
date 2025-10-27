import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeSwitcher from './ThemeSwitcher.jsx';
import { useCart } from '../context/CartContext.jsx';

const baseLinks = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/orders', label: 'My Orders' },
  { to: '/contact', label: 'Contact' }
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const displayName = [user?.firstName || user?.firstname, user?.lastName || user?.lastname]
    .filter(Boolean)
    .join(' ')
    .trim() || user?.name || user?.email?.split('@')[0];

  const links = user
    ? [...baseLinks, { to: '/account', label: 'Account' }]
    : baseLinks;

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <header className="nav-surface sticky top-0 z-40 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg">
            <span className="text-lg font-bold">CCD</span>
          </div>
          <span className="brand-title text-lg font-semibold text-primary sm:text-xl">Cafe Coffee Day</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-secondary transition hover:text-accent ${isActive ? 'text-accent' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link
            to="/orders"
            className="relative inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--surface-layer)] px-3 py-1.5 text-xs font-semibold text-secondary transition hover:text-accent"
          >
            <ShoppingBagIcon className="h-4 w-4" />
            Cart
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-[var(--accent-contrast)] shadow">
                {cartCount}
              </span>
            )}
          </Link>
          <ThemeSwitcher />
          {user ? (
            <div className="flex items-center gap-3">
              {displayName && (
                <span className="hidden text-sm font-semibold text-primary lg:inline">{displayName}</span>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-[var(--card-border)] px-4 py-1.5 text-sm font-medium text-secondary transition hover:border-[var(--accent)] hover:text-accent"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link className="btn-primary" to="/login">
                Login
              </Link>
              <Link
                className="rounded-full border border-[var(--accent)] px-5 py-2 text-sm font-semibold text-accent transition hover:bg-[var(--accent-soft)]"
                to="/register"
              >
                Join Us
              </Link>
            </div>
          )}
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full bg-[var(--surface-layer)] p-2 text-secondary shadow-md transition hover:shadow-lg md:hidden"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[var(--border-contrast)] bg-[var(--surface-layer)] px-4 py-4 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4 text-sm font-semibold text-secondary">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)}>
                {link.label}
              </NavLink>
            ))}
            <Link to="/orders" onClick={() => setOpen(false)} className="flex items-center gap-2">
              <ShoppingBagIcon className="h-5 w-5" /> Cart ({cartCount})
            </Link>
            <div className="border-t border-[var(--border-contrast)] pt-3">
              <ThemeSwitcher />
            </div>
            {user ? (
              <>
                {displayName && <span className="text-sm text-primary">Signed in as {displayName}</span>}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-left text-accent"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link className="btn-primary w-full justify-center" to="/login" onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link
                  className="rounded-full border border-[var(--accent)] px-5 py-2 text-center text-sm font-semibold text-accent"
                  to="/register"
                  onClick={() => setOpen(false)}
                >
                  Join Us
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
