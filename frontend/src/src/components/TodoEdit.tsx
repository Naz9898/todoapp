import React, { useState } from 'react'


function TodoEdit() {
  // State variables
  const [inputTitle, setInputTitle] = useState<string>('')
  const [inputContent, setInputContent] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState('')

  // Register button
  const handleTodo = async () => {
    setErrorMessage("");
    // Register api call
    try{
      const response = await fetch('http://localhost:3000/todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(""),
      })
      const data = await response.json();
      setErrorMessage(data.message);
      setInputTitle('')
      setInputContent('')
    } catch (error: any) {
      console.error("Network error:", error);
      setErrorMessage("Could not connect to the server. Please check your connection.")
    }
  }
  // JSX return
  return (
    <>
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
        <button onClick={handleTodo}>
          Add
        </button>
        <p>{errorMessage}</p>
      </div>
    </>
  )
}

export default TodoEdit
