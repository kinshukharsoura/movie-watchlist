import { createContext, useContext, useState } from 'react';
import { createRequestToken, validateWithLogin, createSession, getAccount } from '../api/tmdb';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('tmdb_user') || 'null'));

  async function login(username, password) {
    const { request_token } = await createRequestToken();
    await validateWithLogin(username, password, request_token);
    const { session_id } = await createSession(request_token);
    const account = await getAccount(session_id);
    const u = { session_id, id: account.id, username: account.username };
    localStorage.setItem('tmdb_user', JSON.stringify(u));
    setUser(u);
  }

  function logout() {
    localStorage.removeItem('tmdb_user');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}