import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Menu from './pages/Menu.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Orders from './pages/Orders.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Account from './pages/Account.jsx';
import Contact from './pages/Contact.jsx';

const App = () => (
  <div className="app-shell flex min-h-screen flex-col">
    <Navbar />
    <Routes>
      <Route element={<Home />} path="/" />
      <Route element={<Menu />} path="/menu" />
      <Route element={<Orders />} path="/orders" />
      <Route element={<AdminDashboard />} path="/admin" />
      <Route element={<Account />} path="/account" />
      <Route element={<Contact />} path="/contact" />
      <Route element={<Login />} path="/login" />
      <Route element={<Register />} path="/register" />
    </Routes>
    <footer className="app-footer mt-auto py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Cafe Coffee Day. All rights reserved.</p>
        <p>Crafted with ☕ and code.</p>
      </div>
    </footer>
  </div>
);

export default App;
