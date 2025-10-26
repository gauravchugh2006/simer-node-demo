import { Link } from 'react-router-dom';
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';

const Home = () => (
  <main className="bg-gradient-to-b from-orange-50 via-white to-slate-100">
    <section className="relative overflow-hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 lg:flex-row lg:items-center lg:py-24">
        <div className="flex-1 space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-brand-700 shadow-md">
            <SparklesIcon className="h-5 w-5" /> Freshly Brewed Happiness
          </span>
          <h1 className="hero-title text-4xl font-bold text-slate-900 sm:text-5xl lg:text-6xl">
            Crafted coffees, gourmet bites, and a space designed for your best ideas.
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Discover a curated menu of artisanal beverages and signature desserts. Track your orders in
            real-time, breeze through quick re-orders, and enjoy a unified cafe experience across desktop and mobile.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/menu" className="btn-primary">
              Explore Menu
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center text-sm font-semibold text-brand-600 transition hover:text-brand-700"
            >
              Become a member
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="relative flex flex-1 justify-center">
          <div className="relative grid w-full max-w-md gap-6">
            <div className="card">
              <h3 className="brand-title text-2xl font-semibold text-slate-900">Signature Latte</h3>
              <p className="mt-2 text-sm text-slate-500">
                Velvety espresso balanced with caramel drizzle and a hint of cinnamon.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-semibold text-brand-600">$4.90</span>
                <button className="btn-primary" type="button">
                  Order now
                </button>
              </div>
            </div>
            <div className="card">
              <h3 className="brand-title text-2xl font-semibold text-slate-900">Cocoa Mocha Bliss</h3>
              <p className="mt-2 text-sm text-slate-500">Dark chocolate, frothy milk and espresso shot.</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-semibold text-brand-600">$5.20</span>
                <button className="btn-primary" type="button">
                  Add to cart
                </button>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute -left-32 top-12 hidden h-72 w-72 rounded-full bg-brand-200/60 blur-3xl md:block" />
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-4 py-16">
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
            <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{feature.text}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <h2 className="section-title">Experience Cafe Coffee Day anywhere</h2>
        <p className="section-subtitle">
          Our progressive web experience ensures that whether you are on a bustling commute or working from a desktop,
          you will always have the cafe close at hand.
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="card text-left">
            <h3 className="text-2xl font-semibold text-slate-900">Mobile-first workflows</h3>
            <p className="mt-3 text-sm text-slate-500">
              Optimized navigation, quick re-orders, push notifications, and location-aware cafe discovery make the
              mobile experience effortless.
            </p>
          </div>
          <div className="card text-left">
            <h3 className="text-2xl font-semibold text-slate-900">Desktop command centre</h3>
            <p className="mt-3 text-sm text-slate-500">
              Manage multiple orders, view analytics, and oversee team orders with our responsive dashboards.
            </p>
          </div>
        </div>
      </div>
    </section>
  </main>
);

export default Home;
