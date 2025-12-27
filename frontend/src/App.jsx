import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Appointments from './pages/Appointments';
import AppointmentNew from './pages/AppointmentNew';
import Billing from './pages/Billing';
import ClinicalNotes from './pages/ClinicalNotes';
import Settings from './pages/Settings';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="appointments/new" element={<AppointmentNew />} />
        <Route path="billing" element={<Billing />} />
        <Route
          path="clinical-notes"
          element={
            user?.role === 'PSYCHOLOGIST' ? (
              <ClinicalNotes />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;

