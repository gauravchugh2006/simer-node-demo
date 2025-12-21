import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';
import Navbar from '../components/Navbar.jsx';
import ThemeSwitcher from '../components/ThemeSwitcher.jsx';
import Snowfall from '../components/Snowfall.jsx';
import Orders from '../pages/Orders.jsx';
import AdminDashboard from '../pages/AdminDashboard.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import { CartProvider } from '../context/CartContext.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import api from '../services/api.js';

const renderWithProviders = (ui, route = '/') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>{ui}</CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );

describe('UI integration', () => {
  beforeEach(() => {
    localStorage.clear();
    spyOn(api, 'get').and.returnValue(Promise.resolve({ data: [] }));
    spyOn(api, 'post').and.returnValue(Promise.resolve({ data: { id: 1, items: [], totalPrice: 5, status: 'placed', createdAt: new Date().toISOString() } }));
    spyOn(api, 'patch').and.returnValue(Promise.resolve({ data: { id: 1, status: 'ready', items: [], totalPrice: 5, createdAt: new Date().toISOString() } }));
  });

  it('renders routes via App', async () => {
    localStorage.setItem('ccd-auth', JSON.stringify({ user: { email: 'user@test.com' }, token: 'token' }));
    renderWithProviders(<App />, '/menu');
    expect(await screen.findByText('Menu Highlights')).toBeTruthy();
    renderWithProviders(<App />, '/contact');
    expect(await screen.findByText(/Visit Cafe Coffee Day/i)).toBeTruthy();
  });

  it('shows navbar details and cart count', () => {
    localStorage.setItem('ccd-auth', JSON.stringify({ user: { firstName: 'Test', lastName: 'User' }, token: 'token' }));
    localStorage.setItem('ccd-cart', JSON.stringify([{ id: '1', name: 'Latte', price: 4, quantity: 2 }]));
    renderWithProviders(<Navbar />);
    expect(screen.getByText(/Test User/)).toBeTruthy();
    expect(screen.getByText('Cart')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('toggles theme switcher', () => {
    renderWithProviders(<ThemeSwitcher />);
    fireEvent.click(screen.getByRole('button'));
    expect(document.documentElement.getAttribute('data-theme')).toBeDefined();
  });

  it('renders snowfall particles', () => {
    renderWithProviders(<Snowfall count={3} />);
    expect(document.querySelectorAll('.snowflake').length).toBe(3);
  });

  it('handles order creation flow', async () => {
    localStorage.setItem('ccd-auth', JSON.stringify({ user: { email: 'user@test.com' }, token: 'token' }));
    renderWithProviders(<Orders />, '/orders');
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    fireEvent.change(screen.getByPlaceholderText(/Latte/), { target: { value: 'Latte' } });
    fireEvent.change(screen.getByPlaceholderText(/Total/), { target: { value: '5' } });
    fireEvent.submit(screen.getByRole('button', { name: /Submit/i }).closest('form'));
    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(screen.getByText(/Order placed successfully/i)).toBeTruthy();
  });

  it('allows admin status updates', async () => {
    localStorage.setItem('ccd-auth', JSON.stringify({ user: { email: 'admin@test.com', role: 'admin' }, token: 'token' }));
    renderWithProviders(<AdminDashboard />, '/admin');
    await waitFor(() => expect(api.get).toHaveBeenCalled());
    const statusButtons = await screen.findAllByRole('button', { name: /ready/i });
    fireEvent.click(statusButtons[0]);
    await waitFor(() => expect(api.patch).toHaveBeenCalled());
  });

  it('supports home page cart actions', async () => {
    localStorage.setItem('ccd-auth', JSON.stringify({ user: { email: 'user@test.com' }, token: 'token' }));
    renderWithProviders(<App />, '/');
    const addButtons = screen.getAllByText(/Add to cart/i);
    fireEvent.click(addButtons[0]);
    expect(document.body.textContent).toContain('added to your cart');
    const buyButtons = screen.getAllByText(/Buy now/i);
    fireEvent.click(buyButtons[0]);
    await waitFor(() => expect(api.post).toHaveBeenCalled());
  });
});
