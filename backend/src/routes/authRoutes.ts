import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const secret_key = process.env.JWT_SECRET as string;

const validatePassword = (password: string): boolean => {
    if (password.length < 8) return false;
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return [hasLetters, hasNumbers, hasSymbols].filter(Boolean).length >= 2;
};

const validateMail = (mail: string): boolean => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(mail);
};

// User registration
router.post('/register', async (req: Request, res: Response) => {
    const { username, email, password } = req.body;
    
    if (!username || username.length === 0) {
        return res.status(400).json({ message: "Username cannot be empty" });
    }
    if (!validateMail(email)) {
        return res.status(400).json({ message: "Invalid email format." });
    }
    if (!validatePassword(password)) {
        return res.status(400).json({ message: "Password too weak." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id`;
        await query(sql, [username, email, hashedPassword]);
        res.status(201).json({ message: "Registration completed" });
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(409).json({ message: "Email already registered." });
        }
        res.status(500).json({ message: "Internal server error." });
    }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    if (!email || !password || !validateMail(email)) {
        return res.status(400).json({ message: "Invalid email or password." });
    }

    try {
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const user_row = result.rows[0];
        const isMatch = await bcrypt.compare(password, user_row.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        const user = { user_id: user_row.user_id, username: user_row.username, email: user_row.email };
        const token = jwt.sign(user, secret_key, { expiresIn: '24h' });

        res.status(200).json({ message: "Login!", token, user });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
});

//Check token validity
router.get('/me', authenticateToken, async (req, res) => {
  const user = (req as any).user;
  try{
        const result = await query('SELECT * FROM users WHERE email = $1', [user.email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Invalid token." });
        }
        res.status(200).json({
        message: "Valid session",
        user: user
        });

  } catch(error) {
    res.status(500).json({ message: "Internal server error." });
  }
});

export default router;