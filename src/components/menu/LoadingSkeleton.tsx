/* Skeleton matching the MenuItemCard layout */
export function MenuCardSkeleton() {
    return (
        <div aria-hidden="true" className="flex h-full flex-col overflow-hidden rounded-[22px] border border-line bg-surface">
            <div className="skeleton aspect-[4/3] w-full" />
            <div className="flex flex-col gap-2.5 p-4">
                <div className="skeleton h-4 w-3/4 rounded-full" />
                <div className="skeleton h-3 w-full rounded-full" />
                <div className="skeleton h-3 w-2/3 rounded-full" />
                <div className="mt-3 flex items-center justify-between">
                    <div className="skeleton h-5 w-20 rounded-full" />
                    <div className="skeleton h-10 w-20 rounded-full" />
                </div>
            </div>
        </div>
    )
}
