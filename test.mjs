import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://kyzwjhjryobxhqywkbtp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5endqaGpyeW9ieGhxeXdrYnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MDQ5NjAsImV4cCI6MjA4ODA4MDk2MH0.0p-AGga5MhiHJqSf6-LtNId4ZT4k79bH0MS8WI09Y3c');

async function test() {
    const { data: b } = await supabase.from('branches').select('id').limit(1);

    if (b && b.length > 0) {
        console.log("Branch:", b[0].id);
        const { data, error } = await supabase.from('orders').insert({
            customer_name: 'Test',
            customer_phone: '1234567890',
            branch_id: b[0].id,
            order_type: 'delivery',
            subtotal: 100,
            delivery_fee: 0,
            loyalty_discount: 0,
            promo_discount: 0,
            total: 100,
            payment_method: 'cod',
            status: 'pending',
            payment_status: 'pending',
        });
        console.log("Order Insert:", data, error);
    } else {
        console.log("No branches found");
    }
}

test();
