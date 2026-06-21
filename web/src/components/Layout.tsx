import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../lib/auth-context';

const nav = [
  { to: '/', label: 'Dashboard', permission: 'dashboard.view' },
  { to: '/bills', label: 'Contas', permission: 'bills.view' },
  { to: '/categories', label: 'Categorias', permission: 'categories.view' },
  { to: '/notifications', label: 'Histórico', permission: 'history.view' },
  { to: '/permissions', label: 'Permissões', permission: 'permissions.view' },
  { to: '/preferences', label: 'Preferências', permission: 'users.update' },
];

export function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const permissions = user?.permissions ?? [];

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">PA</span>
          <span>
            <strong>Payment Alerts</strong>
            <small>web</small>
          </span>
        </Link>

        <div className="topbar-actions">
          <span className="user-chip">{user?.name}</span>
          <button
            className="ghost-button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sair
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar panel">
          {nav
            .filter((item) => permissions.includes(item.permission as string))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => (isActive ? 'side-link active' : 'side-link')}
              >
                {item.label}
              </NavLink>
            ))}
        </aside>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
