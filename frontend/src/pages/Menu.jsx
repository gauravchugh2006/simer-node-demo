const menuItems = [
  {
    name: 'Hazelnut Cappuccino',
    description: 'Classic cappuccino elevated with nutty hazelnut syrup and cocoa dusting.',
    price: '$4.50'
  },
  {
    name: 'Cold Brew Tonic',
    description: 'Slow steeped cold brew over artisanal tonic and citrus peel.',
    price: '$5.80'
  },
  {
    name: 'Rose Pistachio Frappe',
    description: 'Floral rose milk blended with ice, espresso, and crushed pistachio.',
    price: '$6.20'
  },
  {
    name: 'Spiced Masala Chai',
    description: 'Slow simmered spices with Assam tea and creamy milk.',
    price: '$3.80'
  }
];

const Menu = () => (
  <main className="page-section">
    <div className="mx-auto max-w-5xl px-4">
      <header className="text-center">
        <h1 className="section-title">Menu Highlights</h1>
        <p className="section-subtitle">
          Each beverage is thoughtfully crafted with ethically sourced beans and ingredients.
        </p>
      </header>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {menuItems.map((item) => (
          <div key={item.name} className="card">
            <h3 className="text-2xl font-semibold text-primary">{item.name}</h3>
            <p className="mt-3 text-sm text-muted">{item.description}</p>
            <p className="mt-4 text-lg font-semibold text-accent">{item.price}</p>
          </div>
        ))}
      </div>
    </div>
  </main>
);

export default Menu;
