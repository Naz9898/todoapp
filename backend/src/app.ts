import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from './db';

const debug: boolean = false;
const port: number = 3000;
const secret_key = process.env.JWT_SECRET;

if (!secret_key) {
  console.error(" JWT_SECRET is not defined!")
  process.exit(1);
}
const app = express();
app.use(cors());
app.use(express.json());

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

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

// Authentication
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  //Format is "Bearer TOKEN", we need TOKEN
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: "401 Access denied: token missing." });
  }
  try {
    const decoded = jwt.verify(token, secret_key);
    (req as any).user = decoded;
    next(); // Set user
  } catch (err) {
    return res.status(403).json({ message: "403 Access denied: token expired or not valid." });
  }
};

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

// Login
interface LoginRequestBody {
  email: string;
  password: string;
}

interface LoginResponseBody {
  message: string;
  token: string;
}
app.post('/login', async (req: Request<{}, LoginResponseBody, LoginRequestBody>, res: Response) => {
  if(debug){
    console.dir(req.body, { depth: null });
  }
  const { email, password } = req.body;
  if (!email || !password) {
      res.status(400).json({
         message: "400 Bad Request: Invalid email or password." 
      })
  }
  if (!validateMail(email)){
    res.status(400).json({
      message: "400 Bad Request: Invalid email or password.",
    });
    return
  }
  // Check credentials in db
  try{
    const sql = `
      SELECT * FROM USERS 
      WHERE email = $1;
    `;
    const result = await query(sql, [email]);
    if (result.rows.length === 0) {
      res.status(401).json({ message: "400 Bad Request: Invalid email or password." })
      return
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(400).json({ message: "400 Bad Request: Invalid email or password." })
      return
    }
    const token = jwt.sign(
      {
        username: user.username,
        email: user.email,
      },
      secret_key,
      { expiresIn: '24h' }
    )
    res.status(200).json({
      message: "Login!",
      token: token
    })
    return
  } catch (error: any){
    console.error("Database Error:", error)
    res.status(500).json({ message: "Internal server error." })
    return
  }
  return
})

//Check token validity
app.get('/me', authenticateToken, (req, res) => {
  const user = (req as any).user;
  res.status(200).json({
    message: "Valid session",
    user: user
  });
});

