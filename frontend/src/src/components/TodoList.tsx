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
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  // Debug
  const [errorMessage, setErrorMessage] = useState<string>('') 
  
  const getTodos = async () => {
    try{
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage("You must login to add todos.");
        return;
      }
      const response = await fetch('http://localhost:3000/todo?status=${currentFilter}', {
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
    setErrorMessage("")
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
    if (inputDeadline.length === 0){
      setErrorMessage("Invalid deadline. Cannot be empty.")
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
      if(response.ok){
        const data = await response.json();
        setErrorMessage(data.message);
        handleSelectedTodo(data.todo)    
        getTodos()     
      }
    } catch (error: any) {
      console.error("Network error:", error);
      setErrorMessage("Could not connect to the server. Please check your connection.")
    }
  }
  // Delete
  const handleDeleteTodo = async (id: number) => {
    try{
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/todo/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(response.ok){
        const data = await response.json();
        if (selectedTodo?.todo_id === id) {
          handleSelectedTodo(null);
        }
        getTodos()    
        setErrorMessage(data.message); 
      }
    } catch (error: any) {
      console.error("Network error:", error);
      setErrorMessage("Could not connect to the server. Please check your connection.")
    }
  }
  const toggleTodoCompletion = async (e: React.MouseEvent, todo: Todo) => {
    e.stopPropagation(); // Fondamentale: impedisce di selezionare la card quando clicchi sulla spunta

    const token = localStorage.getItem('token');

    const todoData = {
      todo_id: todo.todo_id,
      title: todo.title,
      content: todo.content,
      deadline: todo.deadline,
      is_completed: !todo.is_completed
    };

    try {
      const response = await fetch('http://localhost:3000/todo', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(todoData),
      });

      if (response.ok) {
        const data = await response.json();
        getTodos(); 
        if (selectedTodo?.todo_id === todo.todo_id )
          setSelectedTodo(data.todo)
          setInputIsCompleted(data.todo.is_completed);
      }
    } catch (error) {
      console.error("Update error:", error);
    }
  };
  return (
    <>
      {/* Left Column */}
      <aside className="todo-sidebar">
        <div className="sidebar-header">
          <h2>My task list</h2>
          <button className="add-main-btn" onClick={() => handleSelectedTodo(null)}>
              + New task
          </button>
        </div>

        <ul className="todo-list">
          {todos.map((item) => {
            const isOverdue = item.deadline && new Date(item.deadline) < new Date() && !item.is_completed;

            return (
              <li 
                key={item.todo_id} 
                className={`todo-card ${item.is_completed ? 'completed' : ''} ${selectedTodo?.todo_id === item.todo_id ? 'active' : ''} ${isOverdue ? 'overdue' : ''}`}
                onClick={() => handleSelectedTodo(item)}
              >
                {/* 1. Il testo sta a sinistra */}
                <div className="todo-card-content">
                  <strong>{item.title}</strong>
                  <p>Expires on: {new Date(item.deadline).toLocaleString()}</p>
                </div>

                {/* 2. La spunta viene spinta a destra dal flex-grow del contenuto */}
                <div 
                  className={`todo-check ${item.is_completed ? 'checked' : ''}`}
                  onClick={(e) => toggleTodoCompletion(e, item)}
                >
                  {item.is_completed && '✓'}
                </div>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Add and edit area */}
      <main className="todo-workspace">
        <div className="workspace-card">
          <h2>{selectedTodo === null ? "Create new task" : "Edit task"}</h2>
          
          <div className="form-group">
            <label>Title</label>
            <input 
              type="text" 
              placeholder="Title" 
              value={inputTitle} 
              onChange={(e) => setInputTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Content</label>
            <textarea 
              placeholder="Content" 
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Deadline</label>
            <input 
              type="datetime-local" 
              value={inputDeadline}
              onChange={(e) => setInputDeadline(e.target.value)}
            />
          </div>

          <label className="checkbox-container">
            <input 
              type="checkbox" 
              checked={inputIsCompleted} 
              onChange={(e) => setInputIsCompleted(e.target.checked)} 
            />
            <span>Mark as completed</span>
          </label>

          {/* Last modified and completed date  */}
            {selectedTodo && (
              <div className="todo-metadata">
                <div className="metadata-item">
                  <strong>Last modified:</strong> 
                  <span>{new Date(selectedTodo.last_modified_at).toLocaleString()}</span>
                </div>
                
                {selectedTodo.is_completed && selectedTodo.completed_at && (
                  <div className="metadata-item">
                    <strong>Completed on:</strong> 
                    <span>{new Date(selectedTodo.completed_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

          <button className="save-btn" onClick={handleAddTodo}>
            {selectedTodo === null ? "Add task" : "Edit Todo"}
          </button>
          {selectedTodo && (
            <button 
              className="delete-btn" 
              onClick={() => handleDeleteTodo(selectedTodo.todo_id)}
            >
              Delete Task
            </button>
          )}
          
          {errorMessage && <p className="error-text">{errorMessage}</p>}
        </div>
      </main>
    </>
  )
}

export default TodoList
