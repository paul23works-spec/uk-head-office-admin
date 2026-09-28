import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const env = fs.readFileSync('.env', 'utf-8');
  const urlMatch = env.match(/SUPABASE_URL="(.*)"/);
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY="(.*)"/);
  
  if (!urlMatch || !keyMatch) {
    console.error('Could not parse .env');
    return;
  }
  
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  const { data, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('Error listing buckets:', error);
  } else {
    console.log('Buckets:', data.map(b => b.name));
  }
}

main();
