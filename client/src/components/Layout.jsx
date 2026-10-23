import { useState } from 'react';
import logo from '../pages/logo.png';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Pill, Package, Users, Zap, ShoppingCart, BarChart3, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/medicamentos', label: 'Medicamentos', icon: Pill },
  { to: '/lotes', label: 'Lotes', icon: Package },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/venda-pdv', label: 'Venda PDV', icon: Zap },
  { to: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(true);
  const { user, logout } = useAuth();

  return (
    <div className="app">
      <aside className={`sidebar ${open ? '' : 'collapsed'}`}>
        <div className="sidebar-logo">
          <svg className="sidebar-brand" viewBox="450 892 1459 613"
            role="img" aria-label="ValiMed">
            <image href={logo} width="2500" height="2500" />
          </svg>
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={18} />
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="toggle-btn" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Recolher menu' : 'Expandir menu'}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>

        {open && (
          <div className="sidebar-footer">
            <p className="sidebar-user">{user?.login}</p>
            <p>Sistema Farmácia · v2.0</p>
            <button className="logout-btn" onClick={logout}>
              <LogOut size={15} />
              Sair da conta
            </button>
          </div>
        )}
      </aside>

      <main className="main">
        {children}
      </main>
    </div>
  );
}
