import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { AuthProvider, useAuth } from '../context/AuthContext.jsx';
import { CartProvider, useCart } from '../context/CartContext.jsx';
import { ThemeProvider, useTheme } from '../context/ThemeContext.jsx';
import api from '../services/api.js';

describe('Context providers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('handles auth lifecycle', () => {
    const Consumer = () => {
      const { user, token, login, logout, updateProfile } = useAuth();
      return (
        <div>
          <span data-testid="user">{user?.email || ''}</span>
          <span data-testid="token">{token || ''}</span>
          <button onClick={() => login({ user: { email: 'user@test.com' }, token: 'abc' })}>login</button>
          <button onClick={() => updateProfile({ name: 'Updated' })}>update</button>
          <button onClick={logout}>logout</button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('login'));
    expect(screen.getByTestId('user').textContent).toBe('user@test.com');
    expect(localStorage.getItem('ccd-auth')).toContain('user@test.com');

    fireEvent.click(screen.getByText('update'));
    expect(localStorage.getItem('ccd-auth')).toContain('Updated');

    fireEvent.click(screen.getByText('logout'));
    expect(screen.getByTestId('user').textContent).toBe('');
    expect(localStorage.getItem('ccd-auth')).toBeNull();
  });

  it('manages cart flow and checkout', async () => {
    spyOn(api, 'post').and.returnValue(Promise.resolve({ data: { id: 1 } }));
    localStorage.setItem('ccd-auth', JSON.stringify({ user: { email: 'user@test.com' }, token: 'token' }));

    const Consumer = () => {
      const { cartItems, addToCart, updateQuantity, removeFromCart, cartTotal, checkout } = useCart();
      return (
        <div>
          <span data-testid="total">{cartTotal}</span>
          <button onClick={() => addToCart({ id: '1', name: 'Latte', price: 4 })}>add</button>
          <button onClick={() => updateQuantity('1', 2)}>update</button>
          <button onClick={() => removeFromCart('1')}>remove</button>
          <button onClick={() => checkout()}>checkout</button>
          <span data-testid="count">{cartItems.length}</span>
        </div>
      );
    };

    render(
      <AuthProvider>
        <CartProvider>
          <Consumer />
        </CartProvider>
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('add'));
    fireEvent.click(screen.getByText('update'));
    expect(screen.getByTestId('total').textContent).not.toBe('0');

    await act(async () => {
      await screen.getByText('checkout').click();
    });

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('persists and applies theme', () => {
    const Consumer = () => {
      const { themeId, setThemeId, activeTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme">{themeId}</span>
          <span data-testid="active">{activeTheme.id}</span>
          <button onClick={() => setThemeId('ambient')}>ambient</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('ambient'));
    expect(screen.getByTestId('theme').textContent).toBe('ambient');
    expect(document.documentElement.getAttribute('data-theme')).toBe('ambient');
  });
});
