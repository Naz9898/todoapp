import React from 'react';
import type { Todo, Tag } from '../types';

interface SidebarProps {
  todos: Todo[];
  allTags: Tag[];
  selectedTodoId?: number;
  statusFilter: string;
  activeTagFilter: number | null;
  newTagName: string;
  onSelectTodo: (todo: Todo | null) => void;
  onStatusFilterChange: (status: 'all' | 'completed' | 'pending') => void;
  onTagFilterChange: (tagId: number | null) => void;
  onAddTag: () => void;
  onDeleteTag: (id: number) => void;
  onNewTagNameChange: (name: string) => void;
  onToggleComplete: (e: React.MouseEvent, todo: Todo) => void;
}

const Sidebar = ({
  todos, allTags, selectedTodoId, statusFilter, activeTagFilter,
  newTagName, onSelectTodo, onStatusFilterChange, onTagFilterChange,
  onAddTag, onDeleteTag, onNewTagNameChange, onToggleComplete
}: SidebarProps) => {
  return (
    <aside className="todo-sidebar">
      <div className="sidebar-header">
        <h2>My task list</h2>
        <button className="add-main-btn" onClick={() => onSelectTodo(null)}>
          + New task
        </button>
      </div>

      <div className="filters-section">
        {/* TAG SECTION */}
        <details className="main-tags-collapsible" open>
          <summary className="section-label" style={{ cursor: 'pointer', outline: 'none' }}>
            Tags management
          </summary>
          
          <div className="tags-management" style={{ marginTop: '10px' }}>
            <div className="tag-input-group">
              <input 
                type="text" 
                placeholder="New tag..." 
                value={newTagName}
                onChange={(e) => onNewTagNameChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAddTag()}
              />
              <button onClick={onAddTag} className="add-tag-mini-btn">Add</button>
            </div>

            <details className="tags-details">
              <summary>List tags</summary>
              <ul className="tag-edit-list">
                {allTags.map(tag => (
                  <li key={tag.tag_id}>
                    <span>{tag.tag_name}</span> 
                    <button className="delete-tag-btn" onClick={() => onDeleteTag(tag.tag_id)}>×</button>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </details>

        <p className="section-label" style={{ marginTop: '20px' }}>Filters</p>
        <div className="filters-row">
          <select 
            value={statusFilter} 
            onChange={(e) => onStatusFilterChange(e.target.value as any)}
            className="status-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>

          <select 
            value={activeTagFilter || ""} 
            onChange={(e) => onTagFilterChange(e.target.value ? Number(e.target.value) : null)}
            className="status-select"
          >
            <option value="">All Tags</option>
            {allTags.map(tag => (
              <option key={tag.tag_id} value={tag.tag_id}>{tag.tag_name}</option>
            ))}
          </select>
        </div>
      </div>

      <ul className="todo-list">
        {todos.map((item) => {
          const isOverdue = item.deadline && new Date(item.deadline) < new Date() && !item.is_completed;
          return (
            <li 
              key={item.todo_id} 
              className={`todo-card ${item.is_completed ? 'completed' : ''} ${selectedTodoId === item.todo_id ? 'active' : ''} ${isOverdue ? 'overdue' : ''}`}
              onClick={() => onSelectTodo(item)}
            >
              <div className="todo-card-content">
                <strong>{item.title}</strong>
                <p>Expires on: {new Date(item.deadline).toLocaleString()}</p>
                {item.tags && item.tags.length > 0 && (
                  <div className="tags-pill-container sidebar-tags">
                    {item.tags.map(tag => (
                      <span key={tag?.tag_id} className="tag-pill">{tag?.tag_name}</span>
                    ))}
                  </div>
                )}
              </div>
              <div 
                className={`todo-check ${item.is_completed ? 'checked' : ''}`}
                onClick={(e) => onToggleComplete(e, item)}
              >
                {item.is_completed && '✓'}
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default Sidebar;