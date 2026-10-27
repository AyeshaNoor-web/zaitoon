/** Browser helper for /api/admin/rpc. Throws with the server's message on failure. */
export async function adminCall<T = unknown>(op: string, ...args: unknown[]): Promise<T> {
    const res = await fetch('/api/admin/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ op, args }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
        if (res.status === 401 && typeof window !== 'undefined') {
            window.location.href = `/admin/login?from=${encodeURIComponent(window.location.pathname)}`
        }
        throw new Error(body.error ?? `Request failed (${res.status})`)
    }
    return body.data as T
}
