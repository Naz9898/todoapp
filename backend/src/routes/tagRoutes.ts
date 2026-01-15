import { Router, Request, Response } from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();



router.get('/', authenticateToken, async (req, res) => {
  const user = (req as any).user;
  try {
    const result = await query(
      'SELECT tag_id, tag_name FROM tag WHERE user_id = $1 ORDER BY tag_name ASC',
      [user.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error loading tag" });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { tag_name } = req.body;
  const user = (req as any).user;
  if (!tag_name) {
    return res.status(400).json({ error: "Tag name is missing" });
  }

  try {
    const result = await query(
      'INSERT INTO tag (tag_name, user_id) VALUES ($1, $2) RETURNING *',
      [tag_name, user.user_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err); 
    res.status(500).json({ error: "Errore database (forse tag duplicato?)" });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user = (req as any).user;

  try {
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

export default router;