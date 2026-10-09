import { createClient } from '@supabase/supabase-js';

let supabaseAdminInstance: any = null;

export function getSupabaseAdmin() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase URL or Service Role Key in environment variables.');
  }
  
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseAdminInstance;
}

const BUCKET_NAME = 'uk enterprise document';

/**
 * Upload a document to Supabase Storage
 */
export async function uploadToStorage(storageKey: string, fileBuffer: Buffer, contentType: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage
    .from(BUCKET_NAME)
    .upload(storageKey, fileBuffer, {
      contentType,
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload to storage: ${error.message}`);
  }

  return data;
}

/**
 * Generate a short-lived signed URL for uploading a document directly from client
 */
export async function getSignedUploadUrl(storageKey: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(storageKey);

  if (error) {
    throw new Error(`Failed to generate signed upload URL: ${error.message}`);
  }

  return data; // { signedUrl, token, path }
}

/**
 * Generate a short-lived signed URL for downloading a document
 */
export async function getSignedDownloadUrl(storageKey: string, expiresInSeconds: number = 60) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storageKey, expiresInSeconds);

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Verify a file exists in storage and return its metadata
 */
export async function verifyFileExists(storageKey: string) {
  const admin = getSupabaseAdmin();
  // Using download with range to avoid downloading whole file, just get headers, 
  // or simply list objects in the folder if the info endpoint is not available.
  // We can use info() or list() for verification.
  // Actually, list() on the specific prefix is best.
  
  const pathParts = storageKey.split('/');
  const fileName = pathParts.pop() || '';
  const folderPath = pathParts.join('/');
  
  const { data, error } = await admin.storage
    .from(BUCKET_NAME)
    .list(folderPath, {
      limit: 1,
      search: fileName
    });

  if (error) {
    throw new Error(`Failed to verify file: ${error.message}`);
  }

  const file = data?.find((f: any) => f.name === fileName);
  if (!file) {
    return false;
  }
  return true;
}

/**
 * Delete a document from Supabase Storage
 */
export async function deleteFromStorage(storageKey: string) {
  const admin = getSupabaseAdmin();
  const { error } = await admin.storage
    .from(BUCKET_NAME)
    .remove([storageKey]);

  if (error) {
    throw new Error(`Failed to delete from storage: ${error.message}`);
  }
}

/**
 * Download a document from Supabase Storage
 */
export async function downloadFromStorage(storageKey: string): Promise<Buffer> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage
    .from(BUCKET_NAME)
    .download(storageKey);

  if (error) {
    throw new Error(`Failed to download from storage: ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
