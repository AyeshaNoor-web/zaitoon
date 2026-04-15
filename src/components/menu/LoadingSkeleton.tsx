/* ── Premium shimmer skeleton for menu item cards ── */
export function MenuCardSkeleton() {
    return (
        <div
            className="rounded-[14px] overflow-hidden flex flex-col"
            style={{ border: '1.5px solid var(--linen)', background: 'white' }}
        >
            {/* Image placeholder */}
            <div
                className="w-full aspect-[5/3] relative overflow-hidden"
                style={{ background: 'var(--linen)' }}
            >
                <div className="absolute inset-0 skeleton-shimmer" />
            </div>

            {/* Content */}
            <div className="p-3.5 flex flex-col gap-2.5">
                {/* Title */}
                <div className="h-4 rounded-full relative overflow-hidden"
                    style={{ background: 'var(--linen)', width: '72%' }}>
                    <div className="absolute inset-0 skeleton-shimmer" />
                </div>

                {/* Rating row */}
                <div className="h-3 rounded-full relative overflow-hidden"
                    style={{ background: 'var(--linen)', width: '28%' }}>
                    <div className="absolute inset-0 skeleton-shimmer" />
                </div>

                {/* Description lines */}
                <div className="h-3 rounded-full relative overflow-hidden"
                    style={{ background: 'var(--linen)', width: '100%' }}>
                    <div className="absolute inset-0 skeleton-shimmer" />
                </div>
                <div className="h-3 rounded-full relative overflow-hidden"
                    style={{ background: 'var(--linen)', width: '80%' }}>
                    <div className="absolute inset-0 skeleton-shimmer" />
                </div>

                {/* Price + button row */}
                <div className="flex justify-between items-center pt-2 mt-1"
                    style={{ borderTop: '1px solid var(--linen)' }}>
                    <div className="h-5 rounded-full relative overflow-hidden"
                        style={{ background: 'var(--linen)', width: '30%' }}>
                        <div className="absolute inset-0 skeleton-shimmer" />
                    </div>
                    <div className="h-8 rounded-[7px] relative overflow-hidden"
                        style={{ background: 'var(--linen)', width: '26%' }}>
                        <div className="absolute inset-0 skeleton-shimmer" />
                    </div>
                </div>
            </div>

            <style>{`
                .skeleton-shimmer {
                    background: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(255,255,255,0.7) 50%,
                        transparent 100%
                    );
                    background-size: 200% 100%;
                    animation: shimmer-sweep 1.6s ease-in-out infinite;
                }
                @keyframes shimmer-sweep {
                    0%   { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
            `}</style>
        </div>
    )
}
