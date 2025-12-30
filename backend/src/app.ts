import express, { Request, Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { query } from './db';

const debug: boolean = false;
const port: number = 3000;

const app = express();
app.use(cors());
app.use(express.json());

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// Routes
app.get('/', (req: Request, res: Response) => {
    res.send('The server is working!')
})

// Register
interface RegisterRequestBody {
  username: string;
  email: string;
  password: string;
}

interface RegisterResponseBody {
  message: string;
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

app.post('/register', async (req: Request<{}, RegisterResponseBody, RegisterRequestBody>, res: Response) => {
  if(debug){
    console.dir(req.body, { depth: null });
  }
  const { username, email, password } = req.body;
  // Input validation
  if (username.length === 0){
    res.status(400).json({
      message: "400 Bad Request: Username cannot be empty",
    });
    return
  }
  if (!validateMail(email)){
    res.status(400).json({
      message: "400 Bad Request: Invalid email format. Make sure it looks like address@example.com",
    });
    return
  }
  if (!validatePassword(password)) {
    res.status(400).json({
      message: "400 Bad Request: Password must be at least 8 characters long and include at least two of the following: letters, numbers, or symbols.",
    });
    return
  }
  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  // Insert in Db
  try{
    const sql = `
      INSERT INTO users (username, email, password_hash) 
      VALUES ($1, $2, $3) 
      RETURNING id, created_at, last_modified;
    `;
    const result = await query(sql, [username, email, hashedPassword]);
    res.status(200).json({
      message: "Registration completed!",
    })
    return
  } catch (error: any){
    // DB Violation error (email)
    if (error.code === '23505') {
      res.status(409).json({ 
        message: "400 Conflict Error: This email address is already registered." 
      })
      return
    }
    console.error("Database Error:", error)
    res.status(500).json({ message: "Internal server error." })
    return
  }
  
})