import { Router, Request, Response } from 'express';
import { query } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();


// Tag
router.get('/', authenticateToken, async (req, res) => {
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
router.post('/', authenticateToken, async (req, res) => {
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
router.delete('/:id', authenticateToken, async (req, res) => {
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

export default router;