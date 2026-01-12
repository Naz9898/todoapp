import React from 'react';
import type { Todo, Tag } from '../types';

const TodoWorkspace = ({
  selectedTodo, inputTitle, inputContent, inputDeadline,
  inputIsCompleted, selectedTagIds, allTags, errorMessage,
  onTitleChange, onContentChange, onDeadlineChange,
  onIsCompletedChange, onTagToggle, onSave, onDelete
}: {
  selectedTodo: Todo | null;
  inputTitle: string;
  inputContent: string;
  inputDeadline: string;
  inputIsCompleted: boolean;
  selectedTagIds: number[];
  allTags: Tag[];
  errorMessage: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onDeadlineChange: (value: string) => void;
  onIsCompletedChange: (value: boolean) => void;
  onTagToggle: (tagId: number) => void;
  onSave: () => void;
  onDelete: (id: number) => void;
}) => {
  return (
    <main className="todo-workspace">
      <div className="workspace-card">
        <h2>{selectedTodo === null ? "Create new task" : "Edit task"}</h2>
        
        <div className="workspace-form-scroll">
          <div className="form-group">
            <label>Title</label>
            <input 
              type="text" 
              placeholder="Title" 
              value={inputTitle} 
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Content</label>
            <textarea 
              placeholder="Content" 
              value={inputContent}
              onChange={(e) => onContentChange(e.target.value)}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Deadline</label>
            <input 
              type="datetime-local" 
              value={inputDeadline}
              onChange={(e) => onDeadlineChange(e.target.value)}
            />
          </div>

          <label className="checkbox-container">
            <input 
              type="checkbox" 
              checked={inputIsCompleted} 
              onChange={(e) => onIsCompletedChange(e.target.checked)} 
            />
            <span>Mark as completed</span>
          </label>

          {selectedTodo && (
            <div className="todo-metadata">
              <div className="metadata-item">
                <strong>Last modified:</strong> 
                <span>{new Date(selectedTodo.last_modified_at).toLocaleString()}</span>
              </div>
              {selectedTodo.is_completed && selectedTodo.completed_at && (
                <div className="metadata-item">
                  <strong>Completed on:</strong> 
                  <span>{new Date(selectedTodo.completed_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Tag Attivi (Pillole) */}
          {selectedTodo && selectedTodo.tags && selectedTodo.tags.length > 0 && (
            <div className="active-tags-display">
              <label className="section-label">Active Tags</label>
              <div className="tags-pill-container">
                {selectedTodo.tags.map(tag => (
                  <span key={tag?.tag_id} className="tag-pill">
                    {tag?.tag_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Selezione Tag */}
          <div className="form-group">
            <details key={selectedTodo?.todo_id || 'new'} className="tags-collapsible">
              <summary className="details-summary">
                <span className="summary-label">Assign Tags</span>
                {selectedTagIds.length > 0 && (
                  <span className="summary-hint">({selectedTagIds.length} selected)</span>
                )}
              </summary>
              <div className="tags-selection-grid">
                {allTags.map(tag => (
                  <label key={tag.tag_id} className="tag-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={selectedTagIds.includes(tag.tag_id)}
                      onChange={() => onTagToggle(tag.tag_id)}
                    />
                    <span>{tag.tag_name}</span>
                  </label>
                ))}
              </div>
            </details>
          </div>
        </div>

        <button className="save-btn" onClick={onSave}>
          {selectedTodo === null ? "Add task" : "Edit Todo"}
        </button>

        {selectedTodo && (
          <button 
            className="delete-btn" 
            onClick={() => onDelete(selectedTodo.todo_id)}
          >
            Delete Task
          </button>
        )}
        
        {errorMessage && <p className="error-text">{errorMessage}</p>}
      </div>
    </main>
  );
};

export default TodoWorkspace;