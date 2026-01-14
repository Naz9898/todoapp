import { Router, Request, Response } from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

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
  tags: string[] 
}

export type CreateTodoInput = Omit<Todo, 'todo_id' | 'user_id' | 'created_at' | 'last_modified_at' | 'completed_at'>;

interface TodoResponseBody {
  message: string
  todo: Todo | null
}

router.post('/', authenticateToken, async (req: Request<{}, {}, CreateTodoInput>, res: Response<TodoResponseBody>) => {
  const { title, content, deadline, is_completed, tags } = req.body;
  const user = (req as any).user;
  // Input validation
  if (!title || title.trim().length === 0){
    res.status(400).json({
      message: "Title cannot be empty",
      todo: null
    });
    return
  }
  if (!deadline || deadline.length === 0){
    res.status(400).json({
      message: "Deadline cannot be empty",
      todo: null
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
    `
    const result = await query(sql, [user.user_id, title, content, deadline, is_completed])
    const row = result.rows[0]
    const todo: Todo = {
    ...row,           
    tags: []
    }
    if (tags && tags.length > 0) {
      // INSERT INTO todo_tags (todo_id, tag_id) VALUES (1, 10), (1, 12)...
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
    res.status(500).json(
        { 
            message: "Internal server error.", 
            todo: null
        })
    return
  }
})

router.get('/', authenticateToken, async (req: Request, res: Response) => {
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

    if (status === 'completed') {
      sql += ' AND t.is_completed = true';
    } else if (status === 'pending') {
      sql += ' AND t.is_completed = false';
    }

    sql += ' GROUP BY t.todo_id';
    if (tag_id) {
      params.push(tag_id);
      sql += ` HAVING $${params.length} = ANY(array_agg(tg.tag_id))`;
    }

    sql += ' ORDER BY t.created_at DESC';

    const result = await query(sql, params);
    res.json({ todos: result.rows });
  } catch (error) {
    res.status(500).json({ message: "Error fetching todos" });
  }
});

router.put('/', authenticateToken, async (req: Request, res: Response) => {
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

router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
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
export default router;