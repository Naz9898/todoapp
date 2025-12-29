import express, { Request, Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { query } from './db';

const debug: boolean = true;
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
  success: boolean;
  message: string;
}

app.post('/register', async (req: Request<{}, RegisterResponseBody, RegisterRequestBody>, res: Response) => {
  if(debug){
    console.dir(req.body, { depth: null });
  }
  const { username, email, password } = req.body;
  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  // Insert in Db
  const sql = `
      INSERT INTO users (username, email, password_hash) 
      VALUES ($1, $2, $3) 
      RETURNING id, created_at, last_modified;
    `;
    
  const result = await query(sql, [username, email, hashedPassword]);
  res.send('Register request received!')
})