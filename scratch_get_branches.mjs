import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: branches, error: err1 } = await supabase.from('branches').select('id, name');
  console.log('Branches:', branches, err1);

  const { data: users, error: err2 } = await supabase.from('admin_users').select('id, username, role');
  console.log('Admin Users:', users, err2);
}

main();
