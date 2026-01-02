import './App.css'
import { useAuth } from './context/AuthContext';
import Register from './components/Register'
import Login from './components/Login'
import TodoList from './components/TodoList'
import logo from './assets/logo.svg';

function App() {
  const { user, logout } = useAuth();

  return (
    <div className="app-wrapper">
      <header className="main-nav">
        <div className="nav-left">
          <img src={logo} alt="NazTodo Logo" className="nav-logo" />
        </div>
        {user && (
          <div className="user-nav-card">
            <span className="user-email">{user.email}</span>
            <button className="logout-btn-small" onClick={logout}>Logout</button>
          </div>
        )}
      </header>

      <div className="main-content">
        {!user ? (
          <div className='auth-container'>
            <Register />
            <Login /> 
          </div>
        ) : (
          <TodoList /> 
        )}
      </div>
    </div>
  );
}

export default App
