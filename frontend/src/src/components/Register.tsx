import { useState } from 'react'

interface UserDataTemplate {
  username: string,
  email: string,
  password: string,
}

function Register() {
  const [inputUsername, setInputUsername] = useState<string>('')
  const [inputMail, setInputMail] = useState<string>('')
  const [inputPassword, setInputPassword] = useState<string>('')
  const handleRegister = async () => {
    const userData: UserDataTemplate = {
      username: inputUsername,
      email: inputMail,
      password: inputPassword
    };
    await fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
  }
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
          onChange={(e) => setInputMail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={inputPassword} 
          onChange={(e) => setInputPassword(e.target.value)} 
        />
        <button onClick={handleRegister}>
          Register
        </button>
      </div>
    </>
  )
}

export default Register
