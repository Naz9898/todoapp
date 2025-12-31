import React, { useState, useEffect } from 'react'

interface UserDataTemplate {
  email: string,
  password: string,
}

const validateMail = (mail: string): boolean => {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(mail);
};

const checkTokenValidity = async () => {
  // Check if login token is present
  const token = localStorage.getItem('token')
  if(!token) return null
  const response = await fetch('http://localhost:3000/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if(response.ok)
    return data.user
  return null
}

function Login() {

  const [inputMail, setInputMail] = useState<string>('')
  const [inputPassword, setInputPassword] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [loginStatus, setLoginStatus] = useState<boolean>(false)

  useEffect(() => {
      const verify = async () => {
        const userInfo = await checkTokenValidity();
        if (userInfo) {
          setLoginStatus(true);
        } 
      };
      verify();
    }, 
  []);
  
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
        setLoginStatus(true)
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
        <p>{loginStatus ? "Logged in" : "Logged out"}</p>
      </div>
    </>
  )
}

export default Login
