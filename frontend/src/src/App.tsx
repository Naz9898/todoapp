import './App.css'
import { useAuth } from './context/AuthContext';
import Register from './components/Register'
import Login from './components/Login'
import TodoList from './components/TodoList'
import Header from './components/Header'

function App() {
  const { user } = useAuth();

  return (
    <>
      <Header />
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
    </>
  );
}

export default App;