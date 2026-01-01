import React, { useState, useEffect } from 'react'

interface Todo{
  todo_id: number
  user_id: number
  created_at: string
  last_modified_at: string
  title: string
  content: string
  is_completed: boolean
  deadline: string | null
  completed_at: string | null
}

function TodoList() {
  // State variables
  const [todos, setTodos] = useState<Todo[]>([])
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null) 
  const [errorMessage, setErrorMessage] = useState<string>("") 
  const TodoItem = ({todo}: {todo: Todo}) => {
    return (
      <>
        <li style={{ textDecoration: todo.is_completed ? 'line-through' : 'none' }} onClick={() => setSelectedTodo(todo)} >
          {todo.title}
        </li>
      </>
    )
  }
  
  useEffect(() => {

  },
  // Logic function
  )
  return (
    <>
      <div className="card">
        <h1>My todo</h1>
        <ul>
          <li onClick={() => setSelectedTodo(null)}> Add item </li>
          { todos.map( (item) => ( <TodoItem key={item.todo_id} todo={item}/> ) )}
        </ul>
      </div>
      <div className="card">
        <h1>Add todo</h1>
        <input 
          type="text" 
          placeholder="Title" 
          value={selectedTodo === null ? "" : selectedTodo.title} 
        />
        <input 
          type="text" 
          placeholder="Content" 
          value={selectedTodo === null ? "" : selectedTodo.content} 
        />
        <button >
          {selectedTodo === null ? "Add todo" : "Edit todo"}
        </button>
        <p>{errorMessage}</p>
      </div>
    </>
  )
}

export default TodoList
