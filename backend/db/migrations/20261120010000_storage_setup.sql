-- ==============================================================================
-- STORAGE BUCKETS & RLS POLICIES FOR MEDICAL RECORDS & AVATARS
-- ==============================================================================

-- 0. Ensure health_profiles table has avatar_url column
ALTER TABLE health_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 1. Ensure storage buckets exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('medical-records', 'medical-records', false, 52428800, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/dicom', 'text/csv']),
    ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE
SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Medical Records Private Storage Policies
DROP POLICY IF EXISTS "Users can upload own medical records" ON storage.objects;
CREATE POLICY "Users can upload own medical records"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'medical-records' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Users can view own medical records" ON storage.objects;
CREATE POLICY "Users can view own medical records"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'medical-records' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Users can update own medical records" ON storage.objects;
CREATE POLICY "Users can update own medical records"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'medical-records' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
)
WITH CHECK (
    bucket_id = 'medical-records' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Users can delete own medical records" ON storage.objects;
CREATE POLICY "Users can delete own medical records"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'medical-records' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- 3. Public Avatar Storage Policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
)
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);
