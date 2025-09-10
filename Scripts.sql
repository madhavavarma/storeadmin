-- Allow authenticated users to upload files to this bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'storeadmin');

-- Allow authenticated users to select (read) files in this bucket
CREATE POLICY "Allow authenticated read"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'storeadmin');

CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'storeadmin');

-- For identity columns
ALTER TABLE categories ALTER COLUMN id RESTART WITH 6;

-- For serial columns (if using a sequence)
-- Find your sequence name, usually categories_id_seq
ALTER SEQUENCE categories_id_seq RESTART WITH 6;