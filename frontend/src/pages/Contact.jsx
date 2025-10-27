import { MapPinIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const Contact = () => (
  <main className="page-section">
    <div className="mx-auto max-w-5xl px-4">
      <header className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted">Connect</p>
        <h1 className="section-title">Visit Cafe Coffee Day</h1>
        <p className="section-subtitle">
          Drop by our Sevran cafe, give us a ring, or send a note—our baristas are ready to help.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="card space-y-6">
          <h2 className="text-xl font-semibold text-primary">Cafe details</h2>
          <div className="flex items-start gap-3 text-sm text-muted">
            <MapPinIcon className="mt-1 h-5 w-5 text-accent" />
            <div>
              <p className="font-semibold text-primary">Cafe Coffee Day</p>
              <p>10 Rue Gaston Levy, Sevran Livry</p>
              <p>Sevran 93250, France</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm text-muted">
            <PhoneIcon className="mt-1 h-5 w-5 text-accent" />
            <div>
              <p className="font-semibold text-primary">Customer Care</p>
              <p>+33 1 23 45 67 89</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm text-muted">
            <EnvelopeIcon className="mt-1 h-5 w-5 text-accent" />
            <div>
              <p className="font-semibold text-primary">Email</p>
              <p>bonjour@cafecoffeeday.fr</p>
            </div>
          </div>
        </div>
        <div className="card map-wrapper p-0">
          <iframe
            title="Cafe Coffee Day Sevran"
            loading="lazy"
            allowFullScreen
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2621.1481521310634!2d2.52784277645727!3d48.938974896153446!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e612ac2b7b61a1%3A0x7ad36d0f5bd8b7cb!2s10%20Rue%20Gaston%20Levy%2C%2093250%20Sevran%2C%20France!5e0!3m2!1sen!2sfr!4v1700000000000!5m2!1sen!2sfr"
          />
        </div>
      </div>
    </div>
  </main>
);

export default Contact;
