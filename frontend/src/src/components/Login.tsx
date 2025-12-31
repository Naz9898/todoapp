import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext';

interface UserDataTemplate {
  email: string,
  password: string,
}

const validateMail = (mail: string): boolean => {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(mail);
};


function Login() {
  const { user, login } = useAuth()
  const [inputMail, setInputMail] = useState<string>('')
  const [inputPassword, setInputPassword] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  
  // Register button
  const handleLogin = async () => {
    // Input Validation
    if (!validateMail(inputMail) || inputPassword.length === 0){
      setErrorMessage("Mail or password do not match.")
      return
    }
    setErrorMessage("");
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
      const data = await response.json();
      // Login success
      if(response.ok){
        localStorage.setItem('token', data.token);
        login(data.user)
        setInputMail("")
        setInputPassword("")
        setErrorMessage("")
        return
      }
      // Login failed
      else
        setErrorMessage(data.message)
    } catch (error: any) {
      console.error("Network error:", error);
      setErrorMessage("Could not connect to the server. Please check your connection.")
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
        <p>{errorMessage}</p>
        <p>{user === null ? "Logged out" : "Logged in"}</p>        
      </div>
    </>
  )
}

export default Login
