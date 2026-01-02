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
  const [errorMessage, setErrorMessage] = useState('')
  // Input logic functions
  const handleMail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mail: string = e.target.value
    setInputMail(mail)
    validateMail(mail)
    if (mail.length === 0 || validateMail(mail)) 
      setErrorMessage("")
    else
      setErrorMessage("Invalid email format. Make sure it looks like address@example.com")
  }
  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password: string = e.target.value
    setInputPassword(password)
    validatePassword(password)
    if (password.length === 0 || validatePassword(password)) 
      setErrorMessage("")
    else
      setErrorMessage("Password must be at least 8 characters long and include at least two of the following: letters, numbers, or symbols.")
  }
  // Register button
  const handleRegister = async () => {
    // Input Validation
    if (inputUsername.length === 0){
      setErrorMessage("Invaliusername format. Cannot be empty.")
      return
    }
    if (!validateMail(inputMail)){
      setErrorMessage("Invalid email format. Make sure it looks like address@example.com")
      return
    }
    if (!validatePassword(inputPassword)) {
      setErrorMessage("Password must be at least 8 characters long and include at least two of the following: letters, numbers, or symbols.")
      return
    }
    setErrorMessage("");
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
      setErrorMessage(data.message);
      setInputUsername('')
      setInputMail('')
      setInputPassword('')
    } catch (error: any) {
      console.error("Network error:", error);
      setErrorMessage("Could not connect to the server. Please check your connection.")
    }
  }
  // JSX return
  return (
    <>
      <div className="auth-card">
        <h2>Register</h2>
        <label>Username</label>
        <input 
          type="text" 
          placeholder="Username" 
          value={inputUsername} 
          onChange={(e) => setInputUsername(e.target.value)} 
        />
        <label>Email</label>
        <input 
          type="text" 
          placeholder="email@example.com" 
          value={inputMail} 
          onChange={handleMail} 
        />
        <input 
          type="password" 
          placeholder="password" 
          value={inputPassword} 
          onChange={handlePassword} 
        />
        <button onClick={handleRegister}>
          Register
        </button>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    </>
  )
}

export default Register
