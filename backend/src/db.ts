import { Pool } from 'pg';

// Creiamo un'istanza del Pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'postgres', 
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'testpassword',
  port: 5432,
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export default pool;