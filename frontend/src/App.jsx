import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Menu from './pages/Menu.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Orders from './pages/Orders.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

const App = () => (
  <AuthProvider>
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Routes>
        <Route element={<Home />} path="/" />
        <Route element={<Menu />} path="/menu" />
        <Route element={<Orders />} path="/orders" />
        <Route element={<AdminDashboard />} path="/admin" />
        <Route element={<Login />} path="/login" />
        <Route element={<Register />} path="/register" />
      </Routes>
      <footer className="mt-auto bg-slate-900 py-8 text-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">© {new Date().getFullYear()} Cafe Coffee Day. All rights reserved.</p>
          <p className="text-sm">Crafted with ☕ and code.</p>
        </div>
      </footer>
    </div>
  </AuthProvider>
);

export default App;
