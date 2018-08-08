
-- psql -U dev -f ~/Dropbox/Thinkful/week4/day2-knex/node-noteful-v2/db/noteful.sql noteful-app
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS folders;

CREATE TABLE folders (
  id serial PRIMARY KEY,
  name text NOT NULL
);

ALTER SEQUENCE folders_id_seq RESTART WITH 1000;

INSERT INTO folders (name)
VALUES
('Archive'),
('Drafts'),
('Personal'),
('Work');

CREATE TABLE notes
(
  id serial PRIMARY KEY,
  title text NOT NULL,
  content text,
  created timestamp DEFAULT now(),
  folder_id int REFERENCES folders(id) ON DELETE SET NULL
);

INSERT INTO notes
  (title, content, folder_id)
  VALUES
  (
    '5 life lessons learned from dogs',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...',
    100
  );