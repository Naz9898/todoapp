import React, { useState } from 'react'

interface UserDataTemplate {
  username: string,
  email: string,
  password: string,
}

const validatePassword = (password: string): boolean => {
  if (password.length < 8) return false;
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const count = [hasLetters, hasNumbers, hasSymbols].filter(Boolean).length;
  return count >= 2;
};
const validateMail = (mail: string): boolean => {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(mail);
};

function Register() {
  // State variables
  const [inputUsername, setInputUsername] = useState<string>('')
  const [inputMail, setInputMail] = useState<string>('')
  const [inputPassword, setInputPassword] = useState<string>('')
  const [error, setError] = useState('')
  // Input logic functions
  const handleMail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mail: string = e.target.value
    setInputMail(mail)
    validateMail(mail)
    if (mail.length === 0 || validateMail(mail)) 
      setError("")
    else
      setError("Invalid email format. Make sure it looks like address@example.com")
  }
  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password: string = e.target.value
    setInputPassword(password)
    validatePassword(password)
    if (password.length === 0 || validatePassword(password)) 
      setError("")
    else
      setError("Password must be at least 8 characters long and include at least two of the following: letters, numbers, or symbols.")
  }
  // Register button
  const handleRegister = async () => {
    // Input Validation
    if (inputUsername.length === 0){
      setError("Invaliusername format. Cannot be empty.")
      return
    }
    if (!validateMail(inputMail)){
      setError("Invalid email format. Make sure it looks like address@example.com")
      return
    }
    if (!validatePassword(inputPassword)) {
      setError("Password must be at least 8 characters long and include at least two of the following: letters, numbers, or symbols.")
      return
    }
    setError("");
    // Register api call
    const userData: UserDataTemplate = {
      username: inputUsername,
      email: inputMail,
      password: inputPassword
    }
    try{
      const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })
      const data = await response.json();
      setError(data.message);
      setInputUsername('')
      setInputMail('')
      setInputPassword('')
    } catch (error: any) {
      console.error("Network error:", error);
      setError("Could not connect to the server. Please check your connection.")
    }
  }
  // JSX return
  return (
    <>
      <div className="card">
        <h1>Register</h1>
        <input 
          type="text" 
          placeholder="Username" 
          value={inputUsername} 
          onChange={(e) => setInputUsername(e.target.value)} 
        />
        <input 
          type="text" 
          placeholder="Mail" 
          value={inputMail} 
          onChange={handleMail} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={inputPassword} 
          onChange={handlePassword} 
        />
        <button onClick={handleRegister}>
          Register
        </button>
        <input 
          type="text" 
          placeholder="No error" 
          value={error} 
        />
      </div>
    </>
  )
}

export default Register
