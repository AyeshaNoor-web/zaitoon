import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://kyzwjhjryobxhqywkbtp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5endqaGpyeW9ieGhxeXdrYnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDQ5NjAsImV4cCI6MjA4ODA4MDk2MH0.0p-AGga5MhiHJqSf6-LtNId4ZT4k79bH0MS8WI09Y3c');

async function test() {
    const phone = '03001234567';
    const name = 'Test Customer';

    // Try to find existing customer
    const { data: existing, error: existingError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .limit(1)
        .maybeSingle()

    console.log("existing:", existing, "existingError:", existingError);

    // Create new customer
    const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({ phone, name })
        .select()
        .maybeSingle()

    console.log("newCustomer:", newCustomer, "error:", error);
}

test();
