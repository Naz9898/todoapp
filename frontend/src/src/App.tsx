import './App.css'
import { useAuth } from './context/AuthContext';
import Register from './components/Register'
import Login from './components/Login'
import TodoList from './components/TodoList'
import logo from './assets/logo.svg';

function App() {
const { user, logout } = useAuth(); // Usiamo il context!

  return (
    <div className="app-wrapper">
    <header className="main-nav">
        {/* Logo sempre a sinistra */}
        <div className="nav-left">
          <img src={logo} alt="NazTodo Logo" className="nav-logo" />
        </div>

        {/* Info Utente solo se loggato, a destra */}
        {user && (
          <div className="user-nav-card">
            <span className="user-email">{user.email}</span>
            <button className="logout-btn-small" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </header>
      {!user ? (
        <div className='auth-container'>
            <Register />
            <Login /> 
        </div>
      ) : (
        /* DASHBOARD: appare solo se l'utente è loggato */
        <div className="dashboard">
          <main className="content">
            <TodoList />
          </main>
        </div>
      )}
    </div>
    
  );
}

export default App
