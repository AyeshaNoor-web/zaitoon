export function MenuCardSkeleton() {
    return (
        <div className="rounded-3xl overflow-hidden border border-[#E7E0D8] bg-[#FFFDF7] animate-pulse">
            <div className="aspect-video bg-[#E7E0D8]" />
            <div className="p-4 space-y-3">
                <div className="h-4 bg-[#E7E0D8] rounded-full w-3/4" />
                <div className="h-3 bg-[#E7E0D8] rounded-full w-1/3" />
                <div className="h-3 bg-[#E7E0D8] rounded-full w-full" />
                <div className="h-3 bg-[#E7E0D8] rounded-full w-4/5" />
                <div className="flex justify-between items-center pt-2">
                    <div className="h-5 bg-[#E7E0D8] rounded-full w-20" />
                    <div className="h-8 bg-[#E7E0D8] rounded-xl w-16" />
                </div>
            </div>
        </div>
    )
}
