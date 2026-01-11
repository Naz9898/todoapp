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
  tags: { tag_id: number; tag_name: string }[] | null[] | null
}

interface TodoCreateEdit{
  todo_id: number | null
  title: string
  content: string
  deadline: string
  is_completed: boolean
  tags: number[] | null
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
  // Tag
  const [allTags, setAllTags] = useState<{tag_id: number, name: string}[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  // Carica i tag dal server (chiamala in useEffect)
  const fetchTags = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/tag', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    
    // Se il backend manda { tag_id, tag_name }, trasformiamolo in { tag_id, name }
    const formattedTags = data.map((t: any) => ({
      tag_id: t.tag_id,
      name: t.tag_name || t.name // Gestisce entrambi i casi
    }));
    
    setAllTags(formattedTags);
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/tag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tag_name: newTagName.trim() })
      });

      if (response.ok) {
        setNewTagName(""); // Svuota l'input
        fetchTags();      // Aggiorna la lista nella sidebar e nel workspace
      }
    } catch (error) {
      console.error("Error adding tag:", error);
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/tag/${tagId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // 1. Ricarichiamo i tag per aggiornare sidebar e workspace
        fetchTags(); 
        
        // 2. Se il filtro attivo era il tag appena cancellato, resettiamolo
        if (activeTagFilter === tagId) {
          setActiveTagFilter(null);
        }
        
        // 3. Ricarichiamo i Todo perché i loro array di tag sono cambiati
        getTodos(); 
        
        setErrorMessage("Tag eliminato correttamente.");
      } else {
        setErrorMessage("Impossibile eliminare il tag.");
      }
    } catch (error) {
      console.error("Error deleting tag:", error);
      setErrorMessage("Errore di connessione durante l'eliminazione.");
    }
  };
  const getTodos = async (currentFilter: string = statusFilter) => {
    try{
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage("You must login to add todos.");
        return;
      }
      const response = await fetch(`http://localhost:3000/todo?status=${currentFilter}`, {
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
    fetchTags()
  }, [])

  // Logic function
  const handleSelectedTodo = (todo: Todo | null) => {
    if(todo === null){
      setInputTitle("")
      setInputContent("")
      setInputDeadline("")
      setInputIsCompleted(false)
      setSelectedTodo(null)
      setSelectedTagIds([])
    }
    else{
      setInputTitle(todo.title)
      setInputContent(todo.content)
      setInputDeadline(formatDateTime(todo.deadline))
      setInputIsCompleted(todo.is_completed);
      setSelectedTodo(todo)
      const currentTagIds = todo.tags ? todo.tags.map((t: any) => t.tag_id) : [];
      setSelectedTagIds(currentTagIds);
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
      is_completed: inputIsCompleted,
      tags: selectedTagIds,
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

        <div className="filters-section">
          <p className="section-label">Tags</p>
          {/* Gestione Tag (Input sempre visibile, lista a comparsa) */}
          <div className="tags-management">
            <div className="tag-input-group">
              <input 
                type="text" 
                placeholder="New tag..." 
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <button onClick={handleAddTag} className="add-tag-mini-btn">Add</button>
            </div>

            <details className="tags-details">
              <summary>Manage existing tags</summary>
              <ul className="tag-edit-list">
                {allTags.map(tag => (
                  <li key={tag.tag_id}>
                    <span>{tag.name}</span>
                    <button onClick={() => handleDeleteTag(tag.tag_id)}>×</button>
                  </li>
                ))}
              </ul>
            </details>
          </div>
          <p className="section-label">Filters</p>
          <div className="filters-row">
            {/* Filtro Stato */}
            <select 
              value={statusFilter} 
              onChange={(e) => {
                const newFilter = e.target.value as 'all' | 'completed' | 'pending';
                setStatusFilter(newFilter);
                getTodos(newFilter);
              }}
              className="status-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>

            {/* Filtro Tag (Dropdown) */}
            <select 
              value={activeTagFilter || ""} 
              onChange={(e) => setActiveTagFilter(e.target.value ? Number(e.target.value) : null)}
              className="status-select"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag.tag_id} value={tag.tag_id}>{tag.name}</option>
              ))}
            </select>
          </div>
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
          {selectedTodo && selectedTagIds.length > 0 && (
          <div className="active-tags-display">
            <label className="section-label">Active Tags</label>
            <div className="tags-pill-container">
              {allTags
                .filter(tag => selectedTagIds.includes(tag.tag_id))
                .map(tag => (
                  <span key={tag.tag_id} className="tag-pill">
                    {tag.name}
                  </span>
                ))}
            </div>
          </div>
        )}
        
        <div className="form-group">
          <label>Assign Tags</label>
          
          {/* Mostra i nomi dei tag già assegnati in modo testuale */}
          {selectedTagIds.length > 0 && (
            <div className="active-tags-list">
              <span className="hint-text">Active: </span>
              {allTags
                .filter(t => selectedTagIds.includes(t.tag_id))
                .map(t => t.name)
                .join(", ")}
            </div>
          )}

          <div className="tags-selection-grid">
            {allTags.map(tag => (
              <label key={tag.tag_id} className="tag-checkbox-label">
                <input 
                  type="checkbox" 
                  checked={selectedTagIds.includes(tag.tag_id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTagIds([...selectedTagIds, tag.tag_id]);
                    } else {
                      setSelectedTagIds(selectedTagIds.filter(id => id !== tag.tag_id));
                    }
                  }}
                />
                <span>{tag.name}</span>
              </label>
            ))}
          </div>
        </div>

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
