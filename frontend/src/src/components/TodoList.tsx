import React, { useState, useEffect } from 'react'
import type { Todo, Tag, TodoCreateEdit } from '../types';
import Sidebar from './Sidebar';
import TodoWorkspace from './Workspace';

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
  const [allTags, setAllTags] = useState<{tag_id: number, tag_name: string}[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  // Carica i tag dal server (chiamala in useEffect)
  const fetchTags = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/tag', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data: Tag[] = await res.json();
    
    setAllTags(data);
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
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      // 1. Ricarichiamo i tag globali
      fetchTags(); 

      // 2. Determiniamo il nuovo filtro tag
      // Se il tag cancellato era quello attivo, dobbiamo resettare a null
      const nextTagFilter = activeTagFilter === tagId ? null : activeTagFilter;
      
      if (activeTagFilter === tagId) {
        setActiveTagFilter(null);
      }

      // 3. Se il task selezionato nel workspace aveva questo tag, rimuoviamolo dalla visualizzazione locale
      if (selectedTagIds.includes(tagId)) {
        setSelectedTagIds(prev => prev.filter(id => id !== tagId));
      }

      // 4. IMPORTANTISSIMO: Passiamo i valori aggiornati a getTodos
      // Non fidarti dello stato "activeTagFilter" qui perché non è ancora aggiornato
      getTodos(statusFilter, nextTagFilter); 
      
      setErrorMessage("Tag eliminato correttamente.");
    }
  } catch (error) {
    console.error("Error deleting tag:", error);
    setErrorMessage("Errore di connessione.");
  }
};
  const getTodos = async (currentStatus = statusFilter, currentTag = activeTagFilter) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Costruiamo l'URL dinamicamente
        let url = `http://localhost:3000/todo?status=${currentStatus}`;
        if (currentTag) {
          url += `&tag_id=${currentTag}`;
        }

        const response = await fetch(url, {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        setTodos(data.todos);
      } catch (error) {
        console.error("Network error:", error);
      }
    };

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
        
        // 1. Aggiorniamo immediatamente la sidebar
        await getTodos(); 
        
        // 2. Aggiorniamo il task selezionato con i dati nuovi del server
        // Se il backend restituisce il todo aggiornato in data.todo:
        if (data.todo) {
          handleSelectedTodo(data.todo);
        } else {
          // Se il backend non restituisce il todo completo, resetta o richiedi il singolo
          handleSelectedTodo(null); 
        }
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
  e.stopPropagation();

  const token = localStorage.getItem('token');

  // Recuperiamo gli ID dei tag correnti per non perderli durante l'update
  const currentTagIds = todo.tags ? todo.tags.map((t: any) => t.tag_id) : [];

  const todoData = {
    todo_id: todo.todo_id,
    title: todo.title,
    content: todo.content,
    deadline: todo.deadline,
    is_completed: !todo.is_completed,
    tags: currentTagIds // <--- AGGIUNGI QUESTO
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
      // Invece di aspettare getTodos(), l'update locale è più fluido
      getTodos(); 
      // Se il todo che abbiamo appena spuntato è quello aperto nel workspace, aggiorniamolo
      if (selectedTodo?.todo_id === todo.todo_id) {
        const data = await response.json();
        // Assicurati che handleSelectedTodo riceva il todo aggiornato con i tag dal server
        handleSelectedTodo(data.todo);
      }
    }
  } catch (error) {
    console.error("Update error:", error);
  }
};
  return (
    <>
      <Sidebar 
        todos={todos}
        allTags={allTags}
        selectedTodoId={selectedTodo?.todo_id}
        statusFilter={statusFilter}
        activeTagFilter={activeTagFilter}
        newTagName={newTagName}
        onSelectTodo={handleSelectedTodo}
        onStatusFilterChange={(s) => { setStatusFilter(s); getTodos(s, activeTagFilter); }}
        onTagFilterChange={(t) => { setActiveTagFilter(t); getTodos(statusFilter, t); }}
        onAddTag={handleAddTag}
        onDeleteTag={handleDeleteTag}
        onNewTagNameChange={setNewTagName}
        onToggleComplete={toggleTodoCompletion}
      />

      <TodoWorkspace 
        selectedTodo={selectedTodo}
        inputTitle={inputTitle}
        inputContent={inputContent}
        inputDeadline={inputDeadline}
        inputIsCompleted={inputIsCompleted}
        selectedTagIds={selectedTagIds}
        allTags={allTags}
        errorMessage={errorMessage}
        onTitleChange={setInputTitle}
        onContentChange={setInputContent}
        onDeadlineChange={setInputDeadline}
        onIsCompletedChange={setInputIsCompleted}
        onTagToggle={(tagId) => {
          setSelectedTagIds(prev => 
            prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
          );
        }}
        onSave={handleAddTodo}
        onDelete={handleDeleteTodo}
    />
    </>
  )
}

export default TodoList
