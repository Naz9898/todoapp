import React, { useState } from 'react'


function TodoList() {
  // State variables
  const [errorMessage, setErrorMessage] = useState('')

  // JSX return
  return (
    <>
      <div className="card">
        <h1>My todo</h1>
        <p>{errorMessage}</p>
      </div>
    </>
  )
}

export default TodoList
