import React, { useState } from 'react'

interface UserDataTemplate {
  email: string,
  password: string,
}

const validateMail = (mail: string): boolean => {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(mail);
};

function Login() {
  // State variables
  const [inputMail, setInputMail] = useState<string>('')
  const [inputPassword, setInputPassword] = useState<string>('')
  const [error, setError] = useState('')
  const [loginStatus, setLoginStatus] = useState('out')
  
  // Register button
  const handleLogin = async () => {
    // Input Validation
    if (!validateMail(inputMail) || inputPassword.length === 0){
      setError("Mail or password do not match.")
      return
    }
    setError("");
    // Register api call
    const userData: UserDataTemplate = {
      email: inputMail,
      password: inputPassword
    }
    try{
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })
      if(response.ok){
        setLoginStatus("in")
      }
      const data = await response.json();
      setError(data.message);
    } catch (error: any) {
      console.error("Network error:", error);
      setError("Could not connect to the server. Please check your connection.")
    }
  }
  // JSX return
  return (
    <>
      <div className="card">
        <h1>Login</h1>
        <input 
          type="text" 
          placeholder="Mail" 
          value={inputMail} 
          onChange={(e) => setInputMail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={inputPassword} 
          onChange={(e) => setInputPassword(e.target.value)} 
        />
        <button onClick={handleLogin}>
          Login
        </button>
        <input 
          type="text" 
          placeholder="No error" 
          value={error} 
        />
        <input 
          type="text" 
          placeholder="Login status" 
          value={loginStatus} 
        />
      </div>
    </>
  )
}

export default Login
