import 'server-only'
import { adminSupabase } from '@/lib/supabase/admin'
import type { AdminSession } from '@/lib/adminSession'
import { priceItems, insertOrder, OrderError } from '@/lib/server/orders'

// Every admin data operation, with the roles allowed to run it. The browser
// calls these by name through /api/admin/rpc; nothing admin-related talks to
// Supabase directly with the public key any more.

type Role = AdminSession['role']
type Args = unknown[]
interface Op { roles: Role[]; run: (args: Args, session: AdminSession) => Promise<unknown> }

const BOTH: Role[] = ['owner', 'employee']
const OWNER: Role[] = ['owner']

const COLUMNS = {
    menu_items: ['name', 'category_id', 'price', 'price_large', 'description', 'has_sizes', 'badge', 'accompaniments',
        'image_url', 'price_on_request', 'is_available', 'rating', 'display_order', 'tags', 'prep_time'],
    categories: ['label', 'icon', 'display_order', 'is_active'],
    popular_combos: ['name', 'description', 'price', 'image_url', 'is_active', 'display_order'],
    faqs: ['question', 'question_ur', 'answer', 'answer_ur', 'is_active', 'display_order'],
    branches: ['phone', 'whatsapp', 'hours'],
} as const

function pick(table: keyof typeof COLUMNS, input: unknown): Record<string, unknown> {
    if (!input || typeof input !== 'object') throw new OrderError('Invalid data')
    const out: Record<string, unknown> = {}
    for (const col of COLUMNS[table]) {
        if (col in (input as Record<string, unknown>)) out[col] = (input as Record<string, unknown>)[col]
    }
    return out
}

function str(v: unknown, label = 'id'): string {
    if (typeof v !== 'string' || !v) throw new OrderError(`Missing ${label}`)
    return v
}

async function unwrap<T>(p: PromiseLike<{ data: T; error: unknown }>): Promise<T> {
    const { data, error } = await p
    if (error) throw error
    return data
}

const now = () => new Date().toISOString()

export const ADMIN_OPS: Record<string, Op> = {
    // ── Menu ───────────────────────────────────────────────
    'menu.listAll': {
        roles: BOTH,
        run: () => unwrap(adminSupabase.from('menu_items')
            .select('*, categories(label, icon), item_variants(id, label, price, display_order)').order('display_order')),
    },
    'menu.setAvailability': {
        roles: BOTH,
        run: ([id, available]) => unwrap(adminSupabase.from('menu_items').update({ is_available: !!available }).eq('id', str(id))),
    },
    'menu.update': {
        roles: BOTH,
        run: ([id, updates]) => unwrap(adminSupabase.from('menu_items').update(pick('menu_items', updates)).eq('id', str(id)).select().single()),
    },
    'menu.create': {
        roles: BOTH,
        run: ([item]) => unwrap(adminSupabase.from('menu_items').insert(pick('menu_items', item)).select().single()),
    },
    'menu.delete': {
        roles: BOTH,
        run: ([id]) => unwrap(adminSupabase.from('menu_items').delete().eq('id', str(id))),
    },

    // ── Categories ─────────────────────────────────────────
    'categories.create': {
        roles: BOTH,
        run: ([payload]) => unwrap(adminSupabase.from('categories').insert({ ...pick('categories', payload), is_active: true }).select().single()),
    },
    'categories.update': {
        roles: BOTH,
        run: ([id, updates]) => unwrap(adminSupabase.from('categories').update(pick('categories', updates)).eq('id', str(id)).select().single()),
    },
    'categories.delete': {
        roles: BOTH,
        run: ([id]) => unwrap(adminSupabase.from('categories').update({ is_active: false }).eq('id', str(id))),
    },

    // ── Variants ───────────────────────────────────────────
    'variants.list': {
        roles: BOTH,
        run: ([itemId]) => unwrap(adminSupabase.from('item_variants').select('*').eq('menu_item_id', str(itemId)).order('display_order')),
    },
    'variants.replace': {
        roles: BOTH,
        run: async ([itemId, variants]) => {
            const id = str(itemId)
            if (!Array.isArray(variants)) throw new OrderError('Invalid variants')
            await unwrap(adminSupabase.from('item_variants').delete().eq('menu_item_id', id))
            if (variants.length === 0) return []
            const rows = variants.map((v: { label?: unknown; price?: unknown }, i) => ({
                menu_item_id: id,
                label: String(v.label ?? '').slice(0, 60),
                price: Number(v.price) || 0,
                display_order: i,
            }))
            return unwrap(adminSupabase.from('item_variants').insert(rows).select())
        },
    },

    // ── Site content, combos, FAQs ─────────────────────────
    'content.updateBulk': {
        roles: OWNER,
        run: ([entries]) => {
            if (!entries || typeof entries !== 'object') throw new OrderError('Invalid content')
            const rows = Object.entries(entries as Record<string, unknown>).map(([key, value]) => ({
                key: key.slice(0, 80), value: String(value ?? ''), updated_at: now(),
            }))
            return unwrap(adminSupabase.from('site_content').upsert(rows, { onConflict: 'key' }))
        },
    },
    'combos.list': {
        roles: OWNER,
        run: () => unwrap(adminSupabase.from('popular_combos').select('*').order('display_order')),
    },
    'combos.create': {
        roles: OWNER,
        run: ([payload]) => unwrap(adminSupabase.from('popular_combos').insert({ ...pick('popular_combos', payload), updated_at: now() }).select().single()),
    },
    'combos.update': {
        roles: OWNER,
        run: ([id, updates]) => unwrap(adminSupabase.from('popular_combos').update({ ...pick('popular_combos', updates), updated_at: now() }).eq('id', str(id)).select().single()),
    },
    'combos.delete': {
        roles: OWNER,
        run: ([id]) => unwrap(adminSupabase.from('popular_combos').delete().eq('id', str(id))),
    },
    'faqs.list': {
        roles: OWNER,
        run: () => unwrap(adminSupabase.from('faqs').select('*').order('display_order')),
    },
    'faqs.create': {
        roles: OWNER,
        run: ([payload]) => unwrap(adminSupabase.from('faqs').insert({ ...pick('faqs', payload), updated_at: now() }).select().single()),
    },
    'faqs.update': {
        roles: OWNER,
        run: ([id, updates]) => unwrap(adminSupabase.from('faqs').update({ ...pick('faqs', updates), updated_at: now() }).eq('id', str(id)).select().single()),
    },
    'faqs.delete': {
        roles: OWNER,
        run: ([id]) => unwrap(adminSupabase.from('faqs').delete().eq('id', str(id))),
    },

    // ── Reviews ────────────────────────────────────────────
    'reviews.list': {
        roles: OWNER,
        run: () => unwrap(adminSupabase.from('reviews')
            .select('id, rating, comment, is_approved, created_at, customers ( name, phone ), orders ( order_number )')
            .order('created_at', { ascending: false })),
    },
    'reviews.approve': {
        roles: OWNER,
        run: ([id]) => unwrap(adminSupabase.from('reviews').update({ is_approved: true }).eq('id', str(id))),
    },
    'reviews.delete': {
        roles: OWNER,
        run: ([id]) => unwrap(adminSupabase.from('reviews').delete().eq('id', str(id))),
    },

    // ── Orders ─────────────────────────────────────────────
    'orders.list': {
        roles: BOTH,
        run: async ([page, limit, branchId], session) => {
            const size = Math.min(Math.max(Number(limit) || 30, 1), 1000)
            const from = (Math.max(Number(page) || 1, 1) - 1) * size
            // Branch-bound staff only ever see their own branch
            const branch = session.role === 'employee' && session.branch_id ? session.branch_id : (typeof branchId === 'string' ? branchId : null)
            let q = adminSupabase.from('orders')
                .select('*, branches (name), order_items (name, size, quantity, unit_price)', { count: 'exact' })
            if (branch) q = q.eq('branch_id', branch)
            const { data, error, count } = await q.order('created_at', { ascending: false }).range(from, from + size - 1)
            if (error) throw error
            return { orders: data ?? [], total: count ?? 0 }
        },
    },
    'orders.create': {
        // Walk-in / phone orders entered at the counter
        roles: BOTH,
        run: async ([input], session) => {
            const p = (input ?? {}) as Record<string, unknown>
            const { priced, subtotal } = await priceItems(p.items)
            const orderType = p.orderType === 'takeaway' ? 'takeaway' : p.orderType === 'delivery' ? 'delivery' : 'dine-in'
            const branchId = session.role === 'employee' && session.branch_id ? session.branch_id : str(p.branchId, 'branch')
            return insertOrder({
                customer_name: String(p.customerName || 'Walk-in guest').slice(0, 100),
                customer_phone: String(p.customerPhone || 'N/A').slice(0, 20),
                branch_id: branchId,
                order_type: orderType,
                subtotal,
                delivery_fee: 0,
                loyalty_discount: 0,
                tier_discount: 0,
                total: subtotal,
                payment_method: 'cod',
                notes: typeof p.notes === 'string' ? p.notes.slice(0, 500) || null : null,
                status: 'pending',
                payment_status: 'pending',
            }, priced)
        },
    },

    // ── Analytics ──────────────────────────────────────────
    'analytics.get': {
        roles: OWNER,
        run: async ([range]) => {
            const start = new Date()
            if (range === 'week') start.setDate(start.getDate() - 7)
            else if (range === 'month') start.setDate(start.getDate() - 30)
            start.setHours(0, 0, 0, 0)

            const [ordersRes, newCustRes] = await Promise.all([
                adminSupabase.from('orders')
                    .select('id, total, status, order_type, branch_id, created_at, customer_phone, order_items ( name, quantity )')
                    .gte('created_at', start.toISOString()).neq('status', 'cancelled').limit(5000),
                adminSupabase.from('customers').select('id', { count: 'exact', head: true }).gte('created_at', start.toISOString()),
            ])
            if (ordersRes.error) throw ordersRes.error
            const orders = ordersRes.data ?? []
            const totalRevenue = orders.reduce((s, o) => s + (o.total ?? 0), 0)
            return {
                orders,
                totalOrders: orders.length,
                totalRevenue,
                avgOrderValue: orders.length ? Math.round(totalRevenue / orders.length) : 0,
                newCustomers: newCustRes.count ?? new Set(orders.map(o => o.customer_phone)).size,
            }
        },
    },

    // ── Branches & settings ────────────────────────────────
    'branches.listAll': {
        roles: OWNER,
        run: () => unwrap(adminSupabase.from('branches').select('*').order('name')),
    },
    'branches.update': {
        roles: OWNER,
        run: ([id, updates]) => unwrap(adminSupabase.from('branches').update(pick('branches', updates)).eq('id', str(id))),
    },
    'settings.list': {
        roles: OWNER,
        run: () => unwrap(adminSupabase.from('settings').select('key, value')),
    },
}
