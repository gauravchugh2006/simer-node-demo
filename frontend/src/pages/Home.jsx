import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRightIcon, SparklesIcon, ShoppingCartIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

const featuredProducts = [
  {
    id: 'signature-latte',
    name: 'Signature Latte',
    description: 'Velvety espresso balanced with caramel drizzle and a hint of cinnamon.',
    price: 4.9
  },
  {
    id: 'cocoa-mocha',
    name: 'Cocoa Mocha Bliss',
    description: 'Dark chocolate, frothy milk and espresso shot.',
    price: 5.2
  },
  {
    id: 'cold-brew',
    name: 'Cold Brew Tonic',
    description: 'Slow steeped cold brew poured over artisanal tonic and citrus peel.',
    price: 5.8
  }
];

const Home = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { cartItems, addToCart, cartTotal, checkout, updateQuantity, removeFromCart } = useCart();
  const [feedback, setFeedback] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    showFeedback('info', `${product.name} was added to your cart.`);
  };

  const handleBuyNow = async (product) => {
    if (!token) {
      navigate('/login');
      return;
    }
    setProcessingId(product.id);
    try {
      await api.post('/api/orders', {
        items: [{ name: product.name }],
        totalPrice: Number(product.price.toFixed(2))
      });
      showFeedback('success', `${product.name} is now being prepared!`);
    } catch (error) {
      console.error('Buy now failed', error);
      showFeedback('error', error.response?.data?.message || 'Unable to place order right now.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCheckout = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (cartItems.length === 0) {
      showFeedback('info', 'Add a beverage to your cart to get started.');
      return;
    }
    setProcessing(true);
    try {
      await checkout();
      showFeedback('success', 'Your order is on the bar!');
    } catch (error) {
      console.error('Checkout failed', error);
      if (error.message === 'AUTH_REQUIRED') {
        navigate('/login');
      } else {
        showFeedback('error', error.response?.data?.message || 'Unable to submit your order.');
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main>
      <section className="hero-section">
        <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 lg:flex-row lg:items-center lg:py-24">
          <div className="flex-1 space-y-6">
            <span className="badge-soft">
              <SparklesIcon className="h-5 w-5" /> Freshly Brewed Happiness
            </span>
            <h1 className="hero-title text-4xl font-bold text-primary sm:text-5xl lg:text-6xl">
              Crafted coffees, gourmet bites, and a space designed for your best ideas.
            </h1>
            <p className="max-w-2xl text-lg text-muted">
              Discover a curated menu of artisanal beverages and signature desserts. Track your orders in real-time, breeze
              through quick re-orders, and enjoy a unified cafe experience across desktop and mobile.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/menu" className="btn-primary">
                Explore Menu
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center text-sm font-semibold text-accent transition hover:text-primary"
              >
                Become a member
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </div>
            {feedback && (
              <div className="feedback-pill">
                {feedback.type === 'success' && <CheckCircleIcon className="h-4 w-4 text-accent" />}
                {feedback.type === 'error' && <XCircleIcon className="h-4 w-4 text-red-500" />}
                {feedback.type === 'info' && <SparklesIcon className="h-4 w-4" />}
                <span>{feedback.message}</span>
              </div>
            )}
          </div>
          <div className="relative flex flex-1 justify-center">
            <div className="relative grid w-full max-w-md gap-6">
              {featuredProducts.map((product) => (
                <div key={product.id} className="card">
                  <h3 className="brand-title text-2xl font-semibold text-primary">{product.name}</h3>
                  <p className="mt-2 text-sm text-muted">{product.description}</p>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-lg font-semibold text-accent">${product.price.toFixed(2)}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] px-4 py-1.5 text-xs font-semibold text-secondary transition hover:border-[var(--accent)] hover:text-accent"
                      >
                        <ShoppingCartIcon className="h-4 w-4" />
                        Add to cart
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBuyNow(product)}
                        disabled={processingId === product.id}
                        className="btn-primary"
                      >
                        {processingId === product.id ? 'Processing...' : 'Buy now'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute -left-32 top-12 hidden h-72 w-72 rounded-full bg-[var(--accent-soft)] blur-3xl md:block" />
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: 'Digital-first ordering',
                text: 'Plan ahead and schedule pickups with precise timing and order notes.'
              },
              {
                title: 'Coffee concierge',
                text: 'Save your favourites, receive curated recommendations, and explore pairings.'
              },
              {
                title: 'Rewards that matter',
                text: 'Earn beans for every purchase and redeem them for signature treats.'
              }
            ].map((feature) => (
              <div key={feature.title} className="card">
                <h3 className="text-xl font-semibold text-primary">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section bg-[var(--surface-layer)]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
            <div className="card">
              <div className="flex items-center gap-3">
                <RocketLaunchIcon className="h-6 w-6 text-accent" />
                <div>
                  <h2 className="text-xl font-semibold text-primary">Quick cart checkout</h2>
                  <p className="text-sm text-muted">Add favourites and place an order right from the home page.</p>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {cartItems.length === 0 && <p className="text-sm text-muted">Your cart is empty. Add a beverage to get started.</p>}
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--surface-layer)] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-primary">{item.name}</p>
                      <p className="text-xs text-muted">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                        className="form-input w-20 text-center"
                      />
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-xs font-semibold text-muted transition hover:text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted">
                  Cart total <span className="text-primary font-semibold">${cartTotal.toFixed(2)}</span> • {cartCount} item{cartCount === 1 ? '' : 's'}
                </p>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={processing}
                  className="btn-primary w-full justify-center sm:w-auto"
                >
                  {processing ? 'Placing order...' : 'Place order'}
                </button>
              </div>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-primary">Experience Cafe Coffee Day anywhere</h3>
              <p className="mt-3 text-sm text-muted">
                Our progressive web experience ensures that whether you are on a bustling commute or working from a desktop, you will
                always have the cafe close at hand.
              </p>
              <ul className="mt-4 space-y-3 text-sm text-muted">
                <li>• Mobile-first workflows with real-time updates</li>
                <li>• Desktop dashboards for teams and office orders</li>
                <li>• Rewards and recommendations tailored to you</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
