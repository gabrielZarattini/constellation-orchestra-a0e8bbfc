
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true);

CREATE POLICY "Anyone can view generated images"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-images');

CREATE POLICY "Users can upload own generated images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own generated images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own generated images"
ON storage.objects FOR DELETE
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);
