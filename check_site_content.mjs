import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kyzwjhjryobxhqywkbtp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5endqaGpyeW9ieGhxeXdrYnRwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjUwNDk2MCwiZXhwIjoyMDg4MDgwOTYwfQ.KFyMzDi2zRCr_vSvM4aYuaxFEguK8E1OFtMiZ4kCDcg'
);

async function dumpContent() {
    const { data, error } = await supabase.from('site_content').select('*');
    console.log("Site Content:", data, error);
}

dumpContent();
