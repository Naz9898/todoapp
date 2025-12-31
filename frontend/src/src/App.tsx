import viteLogo from '/vite.svg'
import './App.css'
import Register from './components/Register'
import Login from './components/Login'
import TodoEdit from './components/TodoEdit'
import TodoList from './components/TodoList'

function App() {

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
      </div>
      <Register/>
      <Login/>
      <TodoList/>
      <TodoEdit/>
    </>
  )
}

export default App
