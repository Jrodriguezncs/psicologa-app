import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>👩‍⚕️ Sistema</h2>
          <p className="user-name">{user?.name}</p>
          <p className="user-role">
            {user?.role === 'PSYCHOLOGIST' ? 'Psicóloga' : 'Secretaria'}
          </p>
        </div>

        <ul className="nav-menu">
          <li>
            <Link
              to="/"
              className={isActive('/') ? 'active' : ''}
            >
              📊 Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/patients"
              className={location.pathname.startsWith('/patients') ? 'active' : ''}
            >
              👥 Pacientes
            </Link>
          </li>
          <li>
            <Link
              to="/appointments"
              className={isActive('/appointments') ? 'active' : ''}
            >
              📅 Agenda
            </Link>
          </li>
          <li>
            <Link
              to="/billing"
              className={isActive('/billing') ? 'active' : ''}
            >
              💰 Facturación
            </Link>
          </li>
          {user?.role === 'PSYCHOLOGIST' && (
            <li>
              <Link
                to="/clinical-notes"
                className={isActive('/clinical-notes') ? 'active' : ''}
              >
                📝 Notas Clínicas
              </Link>
            </li>
          )}
          <li>
            <Link
              to="/settings"
              className={isActive('/settings') ? 'active' : ''}
            >
              ⚙️ Configuración
            </Link>
          </li>
        </ul>

        <div className="sidebar-footer">
          <button className="btn btn-secondary" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

