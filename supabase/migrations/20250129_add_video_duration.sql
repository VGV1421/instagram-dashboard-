-- Agregar campo video_duration a la tabla posts
-- Solo permite valores: 5, 10, o 15 (segundos)

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS video_duration INTEGER
CHECK (video_duration IN (5, 10, 15))
DEFAULT 10;

-- Comentario explicativo
COMMENT ON COLUMN posts.video_duration IS 'Duración objetivo del video en segundos (5, 10 o 15)';

-- Actualizar posts existentes sin duración a 10 segundos (default)
UPDATE posts
SET video_duration = 10
WHERE video_duration IS NULL;
