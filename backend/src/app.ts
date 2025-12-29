import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
const port: number = 3000;

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!')
})

app.post('/register', (req: Request, res: Response) => {
  console.dir(req.body, { depth: null });
  res.send('Register request received!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})