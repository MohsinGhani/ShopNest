"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag, ArrowRight, ChevronLeft, ChevronRight, Search,
  SlidersHorizontal, Sparkles, TrendingUp, Clock, X,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import type { Product, PaginatedProducts, Category } from "@/types";

export default function Home() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Load categories and featured once
  useEffect(() => {
    apiFetch<Category[]>("/categories").then(setCategories).catch(() => { });
    apiFetch<PaginatedProducts>("/products?featured=true&per_page=4")
      .then((data) => setFeatured(data.items))
      .catch(() => { });
  }, []);

  // Load personalized recommendations when user is signed in
  useEffect(() => {
    if (user) {
      apiFetch<Product[]>("/products/recommendations/personalized")
        .then(setRecommended)
        .catch(() => setRecommended([]));
    } else {
      setRecommended([]);
    }
  }, [user]);

  // Load products when filters/page change
  useEffect(() => {
    let active = true;

    async function fetchData() {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", "6");
      params.set("sort", sort);
      if (search) params.set("search", search);
      if (selectedCategory) params.set("category_id", String(selectedCategory));
      if (minPrice) params.set("min_price", minPrice);
      if (maxPrice) params.set("max_price", maxPrice);

      try {
        const data = await apiFetch<PaginatedProducts>(`/products?${params}`);
        if (active) {
          setProducts(data.items);
          setTotalPages(data.pages);
          setTotal(data.total);
        }
      } catch (e: unknown) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchData();
    return () => { active = false; };
  }, [page, search, selectedCategory, minPrice, maxPrice, sort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setSelectedCategory(null);
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setPage(1);
  };

  const hasActiveFilters = search || selectedCategory || minPrice || maxPrice || sort !== "newest";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-16 space-y-4">
        <div className="inline-flex items-center gap-2 bg-primary/5 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-2">
          <ShoppingBag className="size-4" />
          E-Commerce Demo
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight">
          Welcome to <span className="text-primary">ShopDemo</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Discover quality products at great prices. Browse our collection and start shopping today.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <a href="#products">
            <Button size="lg">
              Browse Products
              <ArrowRight className="size-4" />
            </Button>
          </a>
          <Link href="/login">
            <Button variant="outline" size="lg">Sign In</Button>
          </Link>
        </div>
      </section>

      {/* Recommended for You (personalized, shown when signed in) */}
      {recommended.length > 0 && (
        <>
          <Separator className="my-4" />
          <section className="py-8">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="size-5 text-primary" />
              <h2 className="text-2xl font-bold">Recommended for You</h2>
              <Badge variant="secondary" className="ml-2">Personalized</Badge>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Based on your order history
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommended.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        </>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <>
          <Separator className="my-4" />
          <section className="py-8">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="size-5 text-yellow-500" />
              <h2 className="text-2xl font-bold">Featured Products</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        </>
      )}

      <Separator className="my-4" />

      {/* Products with Search & Filter */}
      <section id="products" className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">All Products</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {total} products available
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="size-4" />
            Filters
          </Button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        {/* Category Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => { setSelectedCategory(null); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${!selectedCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-end gap-4 p-4 rounded-lg border bg-muted/30 mb-6">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Min Price</label>
              <Input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                className="w-28"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Max Price</label>
              <Input
                type="number"
                placeholder="999"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                className="w-28"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Sort By</label>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="size-4" />
                Clear All
              </Button>
            )}
          </div>
        )}

        {/* Active filter badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {search && (
              <Badge variant="secondary" className="gap-1">
                Search: {search}
                <button onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }} className="cursor-pointer">
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1">
                {categories.find(c => c.id === selectedCategory)?.name}
                <button onClick={() => { setSelectedCategory(null); setPage(1); }} className="cursor-pointer">
                  <X className="size-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {error && (
          <div className="text-destructive text-center mb-4 p-4 rounded-lg bg-destructive/10">
            Error: {error}
          </div>
        )}

        {/* Product Grid / Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-6 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {products.length === 0 && !loading && !error && (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingBag className="size-12 mx-auto mb-3 opacity-30" />
            <p>No products found</p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="icon"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
