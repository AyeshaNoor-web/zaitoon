"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SlidersHorizontal } from "lucide-react";
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
          i.description?.toLowerCase().includes(q)
      );
    }
    if (activeFilter !== "all")
      items = items.filter((i) => (i.tags ?? []).includes(activeFilter as ItemTag));
    switch (sort) {
      case "price-asc":  return [...items].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      case "price-desc": return [...items].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      case "rating":     return [...items].sort((a, b) => b.rating - a.rating);
      default:           return items;
    }
  }, [activeCategory, search, activeFilter, sort, allItems]);

  const activeCategoryLabel = categories.find((c) => c.id === activeCategory)?.label;

  return (
    <>
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        role="main"
        className="pb-16 w-full pt-[60px] lg:pt-[68px]"
        style={{ background: "var(--cream)" }}
      >
        {/* ── STICKY HEADER BAR ── */}
        <div
          className="sticky top-[60px] lg:top-[68px] z-40 w-full"
          style={{
            background: "linear-gradient(180deg, var(--olive-darkest) 0%, #384823 100%)",
            borderBottom: "2px solid rgba(217,119,6,0.35)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}
        >
          <div className="max-w-7xl mx-auto flex flex-col">

            {/* Row 1: Search + Filters */}
            <div className="w-full flex flex-col md:flex-row items-center gap-3 px-4 lg:px-8 py-3"
              style={{ borderBottom: "1px solid rgba(253,248,240,0.06)" }}>

              {/* Search */}
              <div className="relative w-full md:max-w-[320px] shrink-0">
                <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4`}
                  style={{ color: "rgba(253,248,240,0.4)" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.searchMenu}
                  aria-label={t.searchMenu}
                  className={`w-full rounded-[8px] text-white text-[14px] transition-all ${isRTL ? "pr-9 pl-10" : "pl-9 pr-10"} py-2.5`}
                  style={{
                    background: "rgba(253,248,240,0.07)",
                    border: "1px solid rgba(253,248,240,0.12)",
                    outline: "none",
                    color: "white",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(217,119,6,0.6)"; e.currentTarget.style.background = "rgba(253,248,240,0.10)" }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(253,248,240,0.12)"; e.currentTarget.style.background = "rgba(253,248,240,0.07)" }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className={`absolute ${isRTL ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full transition-colors hover:bg-white/10`}
                    style={{ color: "rgba(253,248,240,0.5)" }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Filter chips */}
              <div role="radiogroup" aria-label="Filter items"
                className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-0.5 w-full">
                {FILTER_CHIPS.map((chip) => {
                  const active = activeFilter === chip.value;
                  return (
                    <button
                      key={chip.value}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setActiveFilter(chip.value)}
                      className="shrink-0 rounded-[20px] px-4 py-[6px] text-[12px] font-[700] tracking-wide transition-all duration-200"
                      style={{
                        background: active
                          ? "linear-gradient(135deg, var(--amber-warm), #E67E00)"
                          : "rgba(253,248,240,0.06)",
                        color: active ? "var(--olive-darkest)" : "rgba(253,248,240,0.55)",
                        border: active ? "none" : "1px solid rgba(253,248,240,0.12)",
                        boxShadow: active ? "0 3px 10px rgba(217,119,6,0.35)" : "none",
                        transform: active ? "scale(1.02)" : "scale(1)",
                      }}
                    >
                      {chip.label}
                    </button>
                  );
                })}

                {/* Sort */}
                <div className="flex items-center gap-1.5 ml-auto shrink-0">
                  <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: "rgba(253,248,240,0.4)" }} />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    aria-label="Sort items"
                    className="rounded-[6px] text-[12px] font-[600] px-2 py-1.5 transition-colors cursor-pointer"
                    style={{
                      background: "rgba(253,248,240,0.07)",
                      border: "1px solid rgba(253,248,240,0.12)",
                      color: "rgba(253,248,240,0.7)",
                      outline: "none",
                    }}
                  >
                    <option value="default" style={{ background: "#3A4A22" }}>Default</option>
                    <option value="price-asc" style={{ background: "#3A4A22" }}>Price ↑</option>
                    <option value="price-desc" style={{ background: "#3A4A22" }}>Price ↓</option>
                    <option value="rating" style={{ background: "#3A4A22" }}>Top Rated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Row 2: Categories */}
            <div className="w-full overflow-x-auto scrollbar-hide px-4 lg:px-8 py-2.5">
              <ul role="tablist" aria-label="Menu categories" className="flex items-center gap-2">
                {categories.map((cat) => {
                  const active = activeCategory === cat.id;
                  const itemCount = allItems.filter((i) => i.category_id === cat.id).length;
                  return (
                    <li key={cat.id} className="shrink-0">
                      <button
                        role="tab"
                        onClick={() => handleCategoryClick(cat.id)}
                        aria-selected={active}
                        className="flex items-center gap-2 whitespace-nowrap transition-all duration-250 rounded-[8px] px-4 py-2"
                        style={{
                          background: active
                            ? "linear-gradient(135deg, var(--amber-warm), #E67E00)"
                            : "rgba(253,248,240,0.05)",
                          color: active ? "var(--olive-darkest)" : "rgba(253,248,240,0.6)",
                          fontWeight: active ? 700 : 600,
                          fontSize: 13,
                          boxShadow: active ? "0 3px 12px rgba(217,119,6,0.35)" : "none",
                          border: active ? "none" : "1px solid rgba(253,248,240,0.08)",
                          transform: active ? "scale(1.02)" : "scale(1)",
                        }}
                      >
                        {cat.icon} {cat.label}
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-[700]"
                          style={{
                            background: active ? "rgba(92,110,58,0.3)" : "rgba(253,248,240,0.08)",
                            color: active ? "rgba(92,110,58,0.9)" : "rgba(253,248,240,0.4)",
                          }}
                        >
                          {itemCount}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* ── ITEMS SECTION ── */}
        <section aria-label="Menu items" className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-8 min-h-screen">

          {/* BBQ note */}
          {activeCategoryLabel === "BBQ Rolls" && !search && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-4 mb-8 p-5 rounded-[12px]"
              style={{
                background: "white",
                border: "1.5px solid var(--linen)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
              }}
            >
              <span className="text-2xl mt-0.5">🔥</span>
              <p className="text-[14px] text-[var(--stone)] leading-relaxed">
                <strong className="text-[var(--charcoal)] font-[700] uppercase tracking-wider text-[11px] block mb-1">
                  {t.accompaniments}
                </strong>
                {BBQ_ACCOMPANIMENTS}
              </p>
            </motion.div>
          )}

          {/* Category heading */}
          {!search && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8"
            >
              <h2 className={`text-[var(--olive-dark)] flex items-baseline gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                {activeCategoryLabel ?? t.menu}
                <span className="text-[13px] text-[var(--stone)] font-[400] font-body">
                  ({allItems.filter((i) => i.category_id === activeCategory).length} {t.itemsCount})
                </span>
              </h2>
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  transformOrigin: isRTL ? "right" : "left",
                  height: 3,
                  background: "linear-gradient(90deg, var(--amber-warm), var(--amber-bright))",
                  width: 64,
                  marginTop: 10,
                  borderRadius: 99,
                  marginLeft: isRTL ? "auto" : 0,
                }}
              />
            </motion.div>
          )}

          {/* Grid */}
          <AnimatePresence mode="wait">
            {isChanging || loading ? (
              <motion.ul
                role="list"
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5"
              >
                {[...Array(8)].map((_, i) => <MenuCardSkeleton key={i} />)}
              </motion.ul>
            ) : filteredItems.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                role="status"
                aria-live="polite"
                className="flex flex-col items-center justify-center py-28 text-center"
              >
                <span className="text-7xl mb-5 block" style={{ opacity: 0.4 }}>🔍</span>
                <h3 className="text-[var(--charcoal)] mb-2">{t.noItemsFound}</h3>
                <p className="text-[var(--stone)] mb-8">{t.tryDifferent}</p>
                <button
                  onClick={() => { setSearch(""); setActiveFilter("all"); }}
                  aria-label={t.clearFilters}
                  className="btn-primary"
                >
                  {t.clearFilters}
                </button>
              </motion.div>
            ) : (
              <motion.ul
                role="list"
                key={`grid-${activeCategory}`}
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.06 } },
                }}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5"
              >
                {filteredItems.map((item) => (
                  <motion.li
                    key={item.id}
                    variants={{
                      hidden: { opacity: 0, y: 28 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
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
