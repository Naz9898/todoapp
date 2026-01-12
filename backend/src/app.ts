import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js'
import todoRoutes from './routes/todoRoutes.js'
import tagRoutes from './routes/tagRoutes.js'

const port: number = 3000;
const secret_key = process.env.JWT_SECRET;

if (!secret_key) {
  console.error(" JWT_SECRET is not defined!")
  process.exit(1);
}

const app = express()
app.use(cors())
app.use(express.json())
app.use('/', authRoutes)
app.use('/todo', todoRoutes)
app.use('/tag', tagRoutes)
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
