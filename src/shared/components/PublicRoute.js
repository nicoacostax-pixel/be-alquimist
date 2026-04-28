// shared/components/PublicRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Suponiendo que tienes un contexto de auth

const PublicRoute = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (session) {
    // Si ya está logueado, redirige a cuenta
    return <Navigate to="/cuenta" replace />;
  }

  return children;
};

export default PublicRoute;