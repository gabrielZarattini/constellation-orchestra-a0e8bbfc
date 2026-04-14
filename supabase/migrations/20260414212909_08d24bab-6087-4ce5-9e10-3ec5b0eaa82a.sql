-- Make generated-images bucket private
UPDATE storage.buckets SET public = false WHERE id = 'generated-images';

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view generated images" ON storage.objects;

-- Add owner-scoped SELECT policy
CREATE POLICY "Users can view own generated images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]
  );
