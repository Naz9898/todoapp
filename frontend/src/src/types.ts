// Rappresenta il Tag così come arriva dal DB
export interface Tag {
  tag_id: number;
  tag_name: string;
}

// Rappresenta il Todo completo che ricevi dalle GET
export interface Todo {
  todo_id: number;
  user_id: number;
  created_at: string;
  last_modified_at: string;
  title: string;
  content: string;
  is_completed: boolean;
  deadline: string;
  completed_at: string | null;
  tags: Tag[] | null; // Il backend manda un array di oggetti Tag
}

// Rappresenta i dati necessari per creare o modificare un Todo (POST/PUT)
export interface TodoCreateEdit {
  todo_id: number | null;
  title: string;
  content: string;
  deadline: string;
  is_completed: boolean;
  tags: number[] | null; // Il backend si aspetta solo gli ID dei tag
}

// Tipo per i filtri di stato
export type StatusFilter = 'all' | 'completed' | 'pending';