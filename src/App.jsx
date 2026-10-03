import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Discover from './pages/Discover';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user, logout } = useAuth();
  return (
    <>
      <nav className="nav">
        <Link to="/discover">Discover</Link>
        {user
          ? <button onClick={logout}>Log out ({user.username})</button>
          : <Link to="/login">Log in</Link>}
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/discover" replace />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </>
  );
}