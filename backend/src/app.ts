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
      RETURNING user_id, created_at, last_modified_at;
    `;
    const result = await query(sql, [username, email, hashedPassword]);
    res.status(201).json({
      message: "Registration completed",
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
interface User {
  user_id: string
  email: string
  username: string
}

interface LoginRequestBody {
  email: string
  password: string
}

interface LoginResponseBody {
  message: string
  token: string
  user: User
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
    const user_row = result.rows[0];
    const user = {
        user_id: user_row.user_id,
        username: user_row.username,
        email: user_row.email,
    }
    const isMatch = await bcrypt.compare(password, user_row.password_hash);
    if (!isMatch) {
      res.status(400).json({ message: "400 Bad Request: Invalid email or password." })
      return
    }
    const token = jwt.sign(
      user,
      secret_key,
      { expiresIn: '24h' }
    )
    res.status(200).json({
      message: "Login!",
      token: token,
      user: user
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


// Todo
interface Todo{
  todo_id: number
  user_id: number
  created_at: string
  last_modified_at: string
  title: string
  content: string 
  is_completed: boolean
  deadline: string
  completed_at: string | null
  tags: string[] | null
}

interface TodoRequestBody {
  title: string
  content: string
  deadline: string
  is_completed: boolean
  tags: string[] | null
}

interface TodoResponseBody {
  message: string;
  todo: Todo
}

app.post('/todo', authenticateToken, async (req: Request<{}, TodoResponseBody, TodoRequestBody>, res: Response) => {
  if(debug){
    console.dir(req.body, { depth: null });
  }
  const { title, content, deadline, is_completed, tags } = req.body;
  const user = (req as any).user;
  // Input validation
  if (!title || title.trim().length === 0){
    res.status(400).json({
      message: "400 Bad Request: Title cannot be empty",
    });
    return
  }
  if (!deadline || deadline.length === 0){
    res.status(400).json({
      message: "400 Bad Request: Deadline cannot be empty",
    });
    return
  }

  // Insert in Db
  try{
    await query('BEGIN');
    const sql = `
      INSERT INTO todo (user_id, title, content, deadline, is_completed) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *;
    `;
    const result = await query(sql, [user.user_id, title, content, deadline, is_completed]);
    const row = result.rows[0];
    let todo: Todo = {
        todo_id: row.todo_id,
        user_id: row.user_id,
        created_at: row.created_at,
        last_modified_at: row.last_modified_at,
        title: row.title,
        content: row.content,
        is_completed: row.is_completed, 
        deadline: row.deadline,
        completed_at: row.completed_at || null,
        tags: []
    }
    if (tags && tags.length > 0) {
      // Prepariamo l'inserimento multiplo
      // Esempio: INSERT INTO todo_tags (todo_id, tag_id) VALUES (1, 10), (1, 12)...
      const values = tags.map(tagId => `(${todo.todo_id}, ${tagId})`).join(',');
      const insertTagsQuery = `INSERT INTO todo_tags (todo_id, tag_id) VALUES ${values}`;
      await query(insertTagsQuery);
    }
    const tagsResult = await query(`
      SELECT tag_id, tag_name 
      FROM tag JOIN todo_tags USING (tag_id)
      WHERE todo_id = $1
    `, [todo.todo_id]);
    todo.tags = tagsResult.rows
    await query('COMMIT');

    res.status(201).json({
      message: "Todo created",
      todo: todo
    })
    return
  } catch (error: any){
    await query('ROLLBACK')
    console.error("Database Error:", error)
    res.status(500).json({ message: "Internal server error." })
    return
  }
})

app.get('/todo', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { status, tag_id } = req.query;

  try {
    let sql = `
      SELECT 
        t.*, 
        COALESCE(
          json_agg(
            json_build_object('tag_id', tg.tag_id, 'tag_name', tg.tag_name)
          ) FILTER (WHERE tg.tag_id IS NOT NULL), 
          '[]'
        ) AS tags
      FROM todo t
      LEFT JOIN todo_tags tt ON t.todo_id = tt.todo_id
      LEFT JOIN tag tg ON tt.tag_id = tg.tag_id
      WHERE t.user_id = $1
    `;

    const params: any[] = [user.user_id];

    // Filtro Stato (Pendente/Completato)
    if (status === 'completed') {
      sql += ' AND t.is_completed = true';
    } else if (status === 'pending') {
      sql += ' AND t.is_completed = false';
    }

    sql += ' GROUP BY t.todo_id';

    // FILTRO PER TAG (Utilizziamo HAVING perché tags è un'aggregazione)
    // Oppure, più semplicemente, filtriamo i task che hanno quell'ID nella tabella di giunzione
    if (tag_id) {
      params.push(tag_id);
      // Cerchiamo se nell'aggregazione di ID esiste quello cercato
      sql += ` HAVING $${params.length} = ANY(array_agg(tg.tag_id))`;
    }

    sql += ' ORDER BY t.created_at DESC';

    const result = await query(sql, params);
    res.json({ todos: result.rows });
  } catch (error) {
    res.status(500).json({ message: "Error fetching todos" });
  }
});

app.put('/todo', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { todo_id, title, content, deadline, is_completed, tags } = req.body;

  try {
    await query('BEGIN');
    const sql = `
      UPDATE todo 
      SET 
        title = $1, 
        content = $2, 
        deadline = $3, 
        is_completed = $4, 
        last_modified_at = NOW(),
        completed_at = CASE 
          WHEN $4 = true AND completed_at IS NULL THEN NOW()
          WHEN $4 = false THEN NULL
          ELSE completed_at
        END
      WHERE todo_id = $5 AND user_id = $6
      RETURNING *;
    `;

    const result = await query(sql, [
      title, 
      content, 
      deadline, 
      is_completed, 
      todo_id, 
      user.user_id
    ]);

    if (result.rows.length === 0) {
      await query('ROLLBACK')
      return res.status(404).json({ message: "Todo not found." });
    }
    await query('DELETE FROM todo_tags WHERE todo_id = $1', [todo_id]);

    if(tags && tags.length > 0){
      const values = tags.map((tagId: string) => `(${todo_id}, ${tagId})`).join(',');
      const insertTagsQuery = `INSERT INTO todo_tags (todo_id, tag_id) VALUES ${values}`;
      await query(insertTagsQuery);
    }
    const tagsResult = await query(`
      SELECT tag_id, tag_name 
      FROM tag JOIN todo_tags USING (tag_id)
      WHERE todo_id = $1
    `, [todo_id]);
    let updated_todo: Todo = result.rows[0] 
    updated_todo.tags = tagsResult.rows
    await query('COMMIT');
    res.status(200).json({
      message: "Todo updated.",
      todo: updated_todo
    });

  } catch (error) {
    await query('ROLLBACK')
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.delete('/todo/:id', authenticateToken, async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params; 

  try {
    const sql = `
      DELETE FROM todo 
      WHERE todo_id = $1 AND user_id = $2
      RETURNING *;
    `;

    const result = await query(sql, [id, user.user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: "Todo not found or you don't have permission to delete it." 
      });
    }

    res.status(200).json({
      message: "Todo deleted successfully.",
      deletedTodo: result.rows[0]
    });

  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Tag
// Recupera tutti i tag dell'utente
app.get('/tag', authenticateToken, async (req, res) => {
  const user = (req as any).user;
  try {
    const result = await query(
      'SELECT tag_id, tag_name FROM tag WHERE user_id = $1 ORDER BY tag_name ASC',
      [user.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Errore nel caricamento tag" });
  }
});

// Crea un nuovo tag
app.post('/tag', authenticateToken, async (req, res) => {
  // 1. Il nome del tag arriva dal frontend (body)
  const { tag_name } = req.body;
  
  // 2. L'utente arriva dal middleware di autenticazione (req.user)
  // Usiamo il cast (req as any) se TypeScript si lamenta
  const user = (req as any).user;

  // Controllo di sicurezza
  if (!tag_name) {
    return res.status(400).json({ error: "Il nome del tag è obbligatorio" });
  }

  try {
    const result = await query(
      'INSERT INTO tag (tag_name, user_id) VALUES ($1, $2) RETURNING *',
      [tag_name, user.user_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err); // Questo ti permette di vedere l'errore vero nel terminale
    res.status(500).json({ error: "Errore database (forse tag duplicato?)" });
  }
});

// Elimina un tag (grazie a ON DELETE CASCADE eliminerà anche i collegamenti)
app.delete('/tag/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    // Verifichiamo che il tag appartenga all'utente prima di eliminarlo
    const result = await query(
      'DELETE FROM tag WHERE tag_id = $1 AND user_id = $2 RETURNING *',
      [id, user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tag non trovato o non autorizzato" });
    }

    res.json({ message: "Tag eliminato con successo e rimosso da tutti i task" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore durante l'eliminazione del tag" });
  }
});