"use client";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SearchX, ArrowRight, Info, RotateCw, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileCartBar from "@/components/layout/MobileCartBar";
import MenuItemCard from "@/components/menu/MenuItemCard";
import { MenuCardSkeleton } from "@/components/menu/LoadingSkeleton";
import { getMenuItems, getCategories, getSiteContent } from "@/lib/api/menu";
import { BBQ_ACCOMPANIMENTS } from "@/lib/mock/data";
import { useLanguageStore } from "@/store/useLanguageStore";
import { useCartStore } from "@/store/useCartStore";
import { useHydrated } from "@/store/hydration";
import { translations } from "@/lib/translations";
import { formatPrice } from "@/lib/payment";
import { SITE } from "@/lib/site";
import type { ItemTag, MenuItem, Category } from "@/types";

type SortOption = "default" | "price-asc" | "price-desc" | "rating";
type FilterTag = "all" | ItemTag;

const OTHER_ID = "__other";

const effectivePrice = (i: MenuItem) => i.price ?? i.item_variants?.[0]?.price ?? 0;

export default function MenuPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { language } = useLanguageStore();
  const t = translations[language];
  const cartCount = useCartStore((s) => s.itemCount());
  const cartSubtotal = useCartStore((s) => s.subtotal());

  const FILTER_CHIPS: { label: string; value: FilterTag }[] = [
    { label: t.allItems, value: "all" },
    { label: t.bestsellers, value: "bestseller" },
    { label: t.newTitle, value: "new" },
  ];

  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTag>("all");
  const [sort, setSort] = useState<SortOption>("default");
  const [categories, setCategories] = useState<Category[]>([]);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const railRef = useRef<HTMLDivElement>(null);
  const clickScrolling = useRef(false);

  const fetchMenu = useCallback(() => {
    Promise.all([getCategories(), getMenuItems()])
      .then(([cats, items]) => {
        setCategories(cats);
        setAllItems(items);
        if (cats.length > 0) setActiveCategory(cats[0].id);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMenu();
    getSiteContent().then(setContent).catch(() => {});
  }, [fetchMenu]);

  const retry = () => {
    setLoading(true);
    setLoadError(false);
    fetchMenu();
  };

  // Items whose category is inactive/missing still need a home on the page
  const sections = useMemo(() => {
    const known = new Set(categories.map((c) => c.id));
    const hasOrphans = allItems.some((i) => !i.category_id || !known.has(i.category_id));
    return hasOrphans
      ? [...categories, { id: OTHER_ID, label: "More", icon: null, display_order: 999 }]
      : categories;
  }, [categories, allItems]);

  const filteredItems = useMemo(() => {
    let items = allItems;
    const q = search.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (i) => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)
      );
    }
    if (activeFilter !== "all") items = items.filter((i) => (i.tags ?? []).includes(activeFilter));
    switch (sort) {
      case "price-asc": return [...items].sort((a, b) => effectivePrice(a) - effectivePrice(b));
      case "price-desc": return [...items].sort((a, b) => effectivePrice(b) - effectivePrice(a));
      case "rating": return [...items].sort((a, b) => b.rating - a.rating);
      default: return items;
    }
  }, [search, activeFilter, sort, allItems]);

  const grouped = useMemo(() => {
    const known = new Set(categories.map((c) => c.id));
    const out: Record<string, MenuItem[]> = {};
    filteredItems.forEach((item) => {
      const key = item.category_id && known.has(item.category_id) ? item.category_id : OTHER_ID;
      (out[key] ??= []).push(item);
    });
    return out;
  }, [filteredItems, categories]);

  const countFor = (catId: string) =>
    catId === OTHER_ID
      ? allItems.filter((i) => !categories.some((c) => c.id === i.category_id)).length
      : allItems.filter((i) => i.category_id === catId).length;

  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    clickScrolling.current = true;
    sectionRefs.current[catId]?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => { clickScrolling.current = false; }, 900);
  };

  // Scroll-spy: highlight the category currently in view
  useEffect(() => {
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (clickScrolling.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target?.id) setActiveCategory(visible[0].target.id.replace("cat-", ""));
      },
      { rootMargin: "-200px 0px -55% 0px" }
    );
    sections.forEach((cat) => {
      const el = sectionRefs.current[cat.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections, grouped]);

  // Keep the active chip visible in the horizontal category rail. Scroll only the
  // rail (scrollIntoView would also move the page) and only once the user has
  // moved past the first category, so the filter chips stay visible on load.
  useEffect(() => {
    const rail = railRef.current;
    const chip = chipRefs.current[activeCategory];
    if (!rail || !chip || activeCategory === sections[0]?.id) return;
    const target = chip.offsetLeft - rail.clientWidth / 2 + chip.clientWidth / 2;
    rail.scrollTo({ left: target, behavior: "smooth" });
  }, [activeCategory, sections]);

  const announcement = content["announcement_active"] === "true" ? content["announcement_text"]?.trim() : "";
  const showCartPanel = hydrated && cartCount > 0;

  return (
    <>
      <Navbar />

      <main id="main" className="pt-nav min-h-screen pb-24">
        {/* Intro */}
        <section className="container-page pb-6 pt-10 lg:pt-14">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="section-label">Charcoal grill · Lebanese kitchen</span>
              <h1>{language === "en" ? "The menu" : t.menu}</h1>
              <p className="mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-ink-2">
                Shawarma rolled to order, platters straight off the coals, and everything you need on the side.
                Minimum order {formatPrice(SITE.minOrder)}.
              </p>
            </div>
            {announcement && (
              <p className="flex max-w-md items-start gap-3 rounded-2xl border border-ember-100 bg-ember-100/60 px-4 py-3 text-sm text-ember-700">
                <Info className="mt-0.5 h-4 w-4 shrink-0" /> {announcement}
              </p>
            )}
          </div>
        </section>

        {/* Sticky toolbar */}
        <div className="top-nav sticky z-30 border-y border-line bg-paper/92 backdrop-blur-xl">
          <div className="container-page flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2 lg:order-2 lg:ms-auto">
              <div className="relative min-w-0 flex-1 lg:w-64 lg:flex-none">
                <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.searchMenu}
                  aria-label={t.searchMenu}
                  className="field !min-h-11 !rounded-full ps-10 pe-10"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute end-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-2 hover:bg-paper-2"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                aria-label="Sort items"
                className="field !min-h-11 !w-auto shrink-0 !rounded-full !py-0 !ps-3.5 pe-8 text-sm font-medium"
              >
                <option value="default">Sort</option>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
                <option value="rating">Top rated</option>
              </select>
            </div>

            <div ref={railRef} className="relative -mx-5 flex min-w-0 items-center gap-2 overflow-x-auto px-5 scrollbar-hide lg:order-1 lg:mx-0 lg:flex-1 lg:px-0">
              <div role="radiogroup" aria-label="Filter items" className="flex shrink-0 items-center gap-1.5 border-e border-line pe-3">
                {FILTER_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    role="radio"
                    aria-checked={activeFilter === chip.value}
                    onClick={() => setActiveFilter(chip.value)}
                    className="chip"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <div role="tablist" aria-label="Menu categories" className="flex items-center gap-1">
                {sections.map((cat) => {
                  const active = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      ref={(el) => { chipRefs.current[cat.id] = el; }}
                      role="tab"
                      aria-selected={active}
                      onClick={() => handleCategoryClick(cat.id)}
                      className={`relative shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${active ? "text-ink" : "text-ink-2 hover:text-ink"}`}
                    >
                      {active && (
                        <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-surface shadow-[var(--shadow-soft)] ring-1 ring-line" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                      )}
                      <span className="relative whitespace-nowrap">
                        {cat.label} <span className="tabular text-ink-3">{countFor(cat.id)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <section aria-label="Menu items" className="container-page min-h-[60vh] py-10">
          {loading ? (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => <li key={i}><MenuCardSkeleton /></li>)}
            </ul>
          ) : loadError ? (
            <div role="alert" className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
              <h2 className="text-2xl">We couldn&apos;t load the menu</h2>
              <p className="mt-2 text-ink-2">Check your connection and try again.</p>
              <button onClick={retry} className="btn-outline-dark mt-6"><RotateCw className="h-4 w-4" /> Try again</button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div role="status" className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-paper-2">
                <SearchX className="h-7 w-7 text-ink-3" />
              </div>
              <h2 className="mt-5 text-2xl">{t.noItemsFound}</h2>
              <p className="mt-2 text-ink-2">{t.tryDifferent}</p>
              <button onClick={() => { setSearch(""); setActiveFilter("all"); }} className="btn-outline-dark mt-6">
                {t.clearFilters}
              </button>
            </div>
          ) : (
            <div className="space-y-16">
              {sections.map((cat) => {
                const items = grouped[cat.id] ?? [];
                if (items.length === 0) return null;
                const isBBQ = /bbq/i.test(cat.label);
                const isDips = /dip|sauce/i.test(cat.label);
                const accompaniment = items.find((i) => i.accompaniments)?.accompaniments ?? content["bbq_accompaniments"] ?? BBQ_ACCOMPANIMENTS;
                return (
                  <section
                    key={cat.id}
                    id={`cat-${cat.id}`}
                    ref={(el) => { sectionRefs.current[cat.id] = el; }}
                    className="scroll-mt-[calc(var(--nav-h)+140px)] lg:scroll-mt-[calc(var(--nav-h)+90px)]"
                  >
                    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line pb-4">
                      <h2 className="text-[clamp(1.75rem,3vw,2.25rem)]">
                        {cat.label}
                        <span className="tabular ms-3 align-middle font-sans text-sm font-medium text-ink-3">{items.length}</span>
                      </h2>
                      {isBBQ && !search && (
                        <p className="text-sm text-ink-2">
                          <span className="font-semibold text-ink">{t.accompaniments}:</span> {accompaniment}
                        </p>
                      )}
                      {isDips && content["dips_note"] && (
                        <p className="text-sm text-ink-2">{content["dips_note"]}</p>
                      )}
                    </header>

                    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {items.map((item, i) => (
                        <motion.li
                          key={item.id}
                          initial={{ opacity: 0, y: 16 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{ duration: 0.45, delay: Math.min(i, 6) * 0.04, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <MenuItemCard item={item} />
                        </motion.li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </section>

        {/* Desktop cart summary */}
        <AnimatePresence>
          {showCartPanel && (
            <motion.aside
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="fixed bottom-6 end-6 z-40 hidden w-[340px] rounded-[24px] bg-ink p-4 text-paper shadow-[var(--shadow-float)] lg:block"
            >
              <div className="mb-3 flex items-center justify-between px-1 text-sm">
                <span className="inline-flex items-center gap-2 text-paper/75">
                  <ShoppingBag className="h-4 w-4" /> {cartCount} item{cartCount === 1 ? "" : "s"}
                </span>
                {cartSubtotal < SITE.minOrder && (
                  <span className="text-paper/60">{formatPrice(SITE.minOrder - cartSubtotal)} to minimum</span>
                )}
              </div>
              <button
                onClick={() => router.push("/checkout")}
                disabled={cartSubtotal < SITE.minOrder}
                className="btn-primary w-full justify-between"
              >
                <span>Checkout</span>
                <span className="flex items-center gap-2">
                  <span className="tabular">{formatPrice(cartSubtotal)}</span>
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </span>
              </button>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      <Footer />
      <MobileCartBar />
    </>
  );
}
