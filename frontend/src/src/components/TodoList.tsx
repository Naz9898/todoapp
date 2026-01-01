import React, { useState, useEffect } from 'react'

interface Todo{
  todo_id: number
  user_id: number
  created_at: string
  last_modified_at: string
  title: string
  content: string 
  is_completed: boolean
  deadline: string
  completed_at: string | null
}

interface TodoCreateEdit{
  todo_id: number | null
  title: string
  content: string
  deadline: string
  is_completed: boolean
}

const formatDateTime = (dateString: string | null) => {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function TodoList() {
  // List State variables
  const [todos, setTodos] = useState<Todo[]>([])
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null) 
  // Add/Edit todo state variables
  const [inputTitle, setInputTitle] = useState<string>('')
  const [inputContent, setInputContent] = useState<string>('')
  const [inputDeadline, setInputDeadline] = useState<string>('');
  const [inputIsCompleted, setInputIsCompleted] = useState<boolean>(false);
  // Debug
  const [errorMessage, setErrorMessage] = useState<string>('') 
  
  const TodoItem = ({todo}: {todo: Todo}) => {
    return (
      <>
        <li style={{ textDecoration: todo.is_completed ? 'line-through' : 'none' }} onClick={() => handleSelectedTodo(todo)} >
          {todo.title}
        </li>
      </>
    )
  }
  
  const getTodos = async () => {
    try{
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage("You must login to add todos.");
        return;
      }
      const response = await fetch('http://localhost:3000/todo', {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json();
      setTodos(data.todos);
    } catch (error: any) {
      console.error("Network error:", error);
      setErrorMessage("Could not connect to the server. Please check your connection.")
    }
  }

  useEffect( () => {
    getTodos()
  }, [])

// Logic function
  const handleSelectedTodo = (todo: Todo | null) => {
    if(todo === null){
      setInputTitle("")
      setInputContent("")
      setInputDeadline("")
      setInputIsCompleted(false)
      setSelectedTodo(null)
    }
    else{
      setInputTitle(todo.title)
      setInputContent(todo.content)
      setInputDeadline(formatDateTime(todo.deadline))
      setInputIsCompleted(todo.is_completed);
      setSelectedTodo(todo)
    }
  }
    
  // Add todo button
  const handleAddTodo = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage("You must login to add todos.");
      return;
    }
    // Input Validation
    if (inputTitle.length === 0){
      setErrorMessage("Invalid title. Cannot be empty.")
      return
    }
    setErrorMessage("");
    // Register api call
    const todoData: TodoCreateEdit = {
      todo_id: selectedTodo===null?null:selectedTodo.todo_id,
      title: inputTitle,
      content: inputContent,
      deadline: inputDeadline,
      is_completed: inputIsCompleted
    }
    try{
      const response = await fetch('http://localhost:3000/todo', {
        method: selectedTodo===null?'POST':'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(todoData),
      })
      const data = await response.json();
      setErrorMessage(data.message);
      setInputTitle('')
      setInputContent('')
      setInputDeadline('')
      setInputIsCompleted(false)
      getTodos()
    } catch (error: any) {
      console.error("Network error:", error);
      setErrorMessage("Could not connect to the server. Please check your connection.")
    }
  }
  return (
    <>
      <div className="card">
        <h1>My todo</h1>
        <ul>
          <button onClick={() => handleSelectedTodo(null)}> Add item </button>
          { todos.map( (item) => ( <TodoItem key={item.todo_id} todo={item}/> ) )}
        </ul>
      </div>
      <div className="card">
        <h1>Add todo</h1>
        <input 
          type="text" 
          placeholder="Title" 
          value={inputTitle} 
          onChange={(e) => setInputTitle(e.target.value)}
        />
        <input 
          type="text" 
          placeholder="Content" 
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
        />
        <input 
          type="datetime-local" 
          value={inputDeadline}
          onChange={(e) => setInputDeadline(e.target.value)}
        />
        <label>
          <input 
            type="checkbox" 
            checked={inputIsCompleted} 
            onChange={(e) => setInputIsCompleted(e.target.checked)} 
          />
          Completed
        </label>
        <button onClick={handleAddTodo}>
          {selectedTodo === null ? "Add todo" : "Edit todo"}
        </button>
        <p>{errorMessage}</p>
      </div>
    </>
  )
}

export default TodoList
