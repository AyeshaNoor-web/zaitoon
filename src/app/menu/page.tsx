"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileCartBar from "@/components/layout/MobileCartBar";
import MenuItemCard from "@/components/menu/MenuItemCard";
import { MenuCardSkeleton } from "@/components/menu/LoadingSkeleton";
import { getMenuItems, getCategories } from "@/lib/api/menu";
import { BBQ_ACCOMPANIMENTS } from "@/lib/mock/data";
import { useLanguageStore } from "@/store/useLanguageStore";
import { translations } from "@/lib/translations";
import type { ItemTag } from "@/types";

type SortOption = "default" | "price-asc" | "price-desc" | "rating";
type FilterTag = "all" | ItemTag;

export default function MenuPage() {
  const { language, isRTL } = useLanguageStore();
  const t = translations[language];

  const FILTER_CHIPS: { label: string; value: FilterTag }[] = [
    { label: t.allItems, value: "all" },
    { label: t.bestsellers, value: "bestseller" },
    { label: t.newTitle, value: "new" },
  ];

  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTag>("all");
  const [sort, setSort] = useState<SortOption>("default");
  const [isChanging, setIsChanging] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    Promise.all([getCategories(), getMenuItems()])
      .then(([cats, items]) => {
        setCategories(cats);
        setAllItems(items);
        if (cats.length > 0) setActiveCategory(cats[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCategoryClick = (catId: string) => {
    setIsChanging(true);
    setActiveCategory(catId);
    setSearch("");
    setTimeout(() => setIsChanging(false), 300);
  };

  const filteredItems = useMemo(() => {
    let items = allItems.filter((i) => i.category_id === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = allItems.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q),
      );
    }
    if (activeFilter !== "all")
      items = items.filter((i) => (i.tags ?? []).includes(activeFilter as ItemTag));
    switch (sort) {
      case "price-asc":
        return [...items].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      case "price-desc":
        return [...items].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      case "rating":
        return [...items].sort((a, b) => b.rating - a.rating);
      default:
        return items;
    }
  }, [activeCategory, search, activeFilter, sort]);

  return (
    <>
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        role="main"
        className="bg-[var(--cream)] pb-12 w-full pt-[60px] lg:pt-[68px]"
      >
        {/* ── STICKY SEARCH/CATEGORIES BAR AT TOP ── */}
        <div className="sticky top-[60px] lg:top-[68px] z-40 bg-[var(--olive-darkest)] border-b-[2px] border-[var(--olive-light)] shadow-xl w-full">
          <div className="max-w-7xl mx-auto flex flex-col items-center">
            {/* Top Row: Search & Filters */}
            <div className="w-full flex flex-col md:flex-row items-center gap-4 px-4 lg:px-8 py-3 bg-[var(--olive-dark)]/50">
              {/* Search Input */}
              <div className="relative w-full md:max-w-sm shrink-0">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.searchMenu}
                  aria-label={t.searchMenu}
                  className={`w-full bg-[var(--olive-darkest)] border-[2px] border-[var(--olive-light)] text-white placeholder-[rgba(253,248,240,0.4)] rounded-[8px] ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 text-[14px] focus:outline-none focus:border-[var(--amber-warm)] transition-colors`}
                />
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-white/50`} />
              </div>

              {/* Filter Chips */}
              <div
                role="radiogroup"
                aria-label="Filter items"
                className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 w-full"
              >
                {FILTER_CHIPS.map((chip) => {
                  const active = activeFilter === chip.value;
                  return (
                    <button
                      key={chip.value}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setActiveFilter(chip.value)}
                      className={`shrink-0 rounded-[20px] px-[16px] py-[6px] text-[12px] font-[600] tracking-wide transition-colors border ${active
                        ? "bg-[var(--amber-warm)] text-[var(--olive-darkest)] border-[var(--amber-warm)]"
                        : "bg-transparent text-white/60 border-[rgba(253,248,240,0.2)] hover:text-white hover:border-white/40"
                        }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Row: Categories */}
            <div className="w-full overflow-x-auto scrollbar-hide bg-[var(--olive-darkest)] px-4 lg:px-8 py-3">
              <ul
                role="tablist"
                aria-label="Menu categories"
                className="flex items-center gap-2 lg:gap-3"
              >
                {categories.map((cat) => {
                  const active = activeCategory === cat.id;
                  return (
                    <li key={cat.id} className="shrink-0">
                      <button
                        role="tab"
                        onClick={() => handleCategoryClick(cat.id)}
                        aria-selected={active}
                        className={`px-4 lg:px-5 py-2.5 rounded-[8px] text-[13px] lg:text-[14px] transition-all flex items-center gap-2 tracking-wide whitespace-nowrap ${active
                          ? "bg-[var(--amber-warm)] text-[var(--olive-darkest)] font-[700] shadow-[0_2px_10px_rgba(217,119,6,0.3)]"
                          : "bg-white/5 text-[rgba(253,248,240,0.7)] hover:bg-white/10 hover:text-white font-[600]"
                          }`}
                      >
                        {cat.icon} {cat.label}
                        <span
                          className={`text-[10px] lg:text-[11px] px-2 py-0.5 rounded-full ${active ? "bg-[var(--olive-darkest)] text-[var(--amber-warm)]" : "bg-white/10"}`}
                        >
                          {
                            allItems.filter((i) => i.category_id === cat.id)
                              .length
                          }
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
        <section
          aria-label="Menu items"
          className="w-full px-4 lg:px-8 py-8 min-h-screen"
        >
          {/* BBQ note */}
          {categories.find((c) => c.id === activeCategory)?.label ===
            "BBQ Rolls" &&
            !search && (
              <div className="flex items-start gap-4 card px-6 py-4 mb-8">
                <span className="text-2xl mt-1">🔥</span>
                <p className="text-[14px] text-[var(--stone)] leading-relaxed">
                  <strong className="text-[var(--charcoal)] font-[700] uppercase tracking-wider text-[11px] block mb-1">
                    {t.accompaniments}
                  </strong>
                  {BBQ_ACCOMPANIMENTS}
                </p>
              </div>
            )}

          {/* Category Heading */}
          {!search && (
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8"
            >
              <h2 className={`text-[var(--olive-dark)] flex items-baseline gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {categories.find((c) => c.id === activeCategory)?.label ??
                  t.menu}
                <span className="text-[13px] text-[var(--stone)] font-[400] font-body">
                  ({allItems.filter((i) => i.category_id === activeCategory).length} {t.itemsCount})
                </span>
              </h2>
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.7,
                  delay: 0.3,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  transformOrigin: isRTL ? "right" : "left",
                  height: 3,
                  backgroundColor: "var(--amber-warm)",
                  width: 64,
                  marginTop: "8px",
                  marginLeft: isRTL ? "auto" : "0",
                }}
              />
            </motion.div>
          )}

          {/* Items grid */}
          <AnimatePresence mode="wait">
            {isChanging || loading ? (
              <motion.ul
                role="list"
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
              >
                {[...Array(6)].map((_, i) => (
                  <MenuCardSkeleton key={i} />
                ))}
              </motion.ul>
            ) : filteredItems.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                role="status"
                aria-live="polite"
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <span className="text-6xl mb-5 block opacity-50">🔍</span>
                <h3 className="text-[var(--charcoal)] mb-2">{t.noItemsFound}</h3>
                <p className="text-[var(--stone)] mb-8">
                  {t.tryDifferent}
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setActiveFilter("all");
                  }}
                  aria-label={t.clearFilters}
                  className="btn-primary"
                >
                  {t.clearFilters}
                </button>
              </motion.div>
            ) : (
              <motion.ul
                role="list"
                key="grid"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.08 } },
                }}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
              >
                {filteredItems.map((item) => (
                  <motion.li
                    key={item.id}
                    variants={{
                      hidden: { opacity: 0, y: 32 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                      },
                    }}
                  >
                    <MenuItemCard item={item} />
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </section>
      </motion.main>
      <Footer />
      <MobileCartBar />
    </>
  );
}
