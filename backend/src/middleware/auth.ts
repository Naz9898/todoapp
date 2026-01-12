import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secret_key = process.env.JWT_SECRET as string;

// Check token validity 
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; //Format is "Bearer TOKEN", we need TOKEN

  if (!token) {
    return res.status(401).json({ message: "401 Access denied: token missing." });
  }

  try {
    const decoded = jwt.verify(token, secret_key);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "403 Access denied: token expired or not valid." });
  }
};