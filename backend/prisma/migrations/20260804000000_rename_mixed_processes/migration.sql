-- Rename existing mixed processes to the new "PROCESO MIXTO - NN" format,
-- keeping a sequential, unique number per process (ordered by creation).
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY "createdAt", id) AS rn
  FROM "Process" WHERE "isMixed" = true
)
UPDATE "Process" p
SET name = 'PROCESO MIXTO - ' || LPAD(numbered.rn::text, 2, '0')
FROM numbered
WHERE p.id = numbered.id;