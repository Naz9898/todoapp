CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(250) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE todo (
    todo_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified_at TIMESTAMPTZ DEFAULT NOW(),
    title VARCHAR(256) NOT NULL,
    content TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    deadline TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,

    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE TABLE tag (
    user_id INTEGER NOT NULL, 
    tag_id SERIAL PRIMARY KEY,
    tag_name VARCHAR(256) UNIQUE NOT NULL,
    
    CONSTRAINT fk_tag_user FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE TABLE todo_tags (
    todo_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (todo_id, tag_id),
    
    CONSTRAINT fk_todo FOREIGN KEY(todo_id) REFERENCES todo(todo_id) ON DELETE CASCADE,
    CONSTRAINT fk_tag FOREIGN KEY(tag_id) REFERENCES tag(tag_id) ON DELETE CASCADE
);