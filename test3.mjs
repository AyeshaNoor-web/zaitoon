import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://kyzwjhjryobxhqywkbtp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5endqaGpyeW9ieGhxeXdrYnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDQ5NjAsImV4cCI6MjA4ODA4MDk2MH0.0p-AGga5MhiHJqSf6-LtNId4ZT4k79bH0MS8WI09Y3c');

async function test() {
    const phone = '03001234568';
    const name = 'Test Customer 2';

    // Create new customer
    const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({ phone, name, referral_code: referralCode })
        .select()
        .maybeSingle()

    console.log("newCustomer:", newCustomer, "error:", error);
}

test();
