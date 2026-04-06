"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, imageUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ShoppingCart, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import type { WishlistItem } from "@/types";

export default function WishlistPage() {
    const { user } = useAuth();
    const { addToCart } = useCart();
    const router = useRouter();
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { router.push("/login"); return; }
        apiFetch<WishlistItem[]>("/wishlist")
            .then(setItems)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [user, router]);

    const removeItem = async (productId: number) => {
        try {
            await apiFetch(`/wishlist/${productId}`, { method: "DELETE" });
            setItems((prev) => prev.filter((i) => i.product_id !== productId));
            toast.success("Removed from wishlist");
        } catch {
            toast.error("Failed to remove item");
        }
    };

    const moveToCart = (item: WishlistItem) => {
        addToCart(item.product);
        removeItem(item.product_id);
        toast.success("Moved to cart");
    };

    if (!user) return null;

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-6">
                <Heart className="size-6" />
                <h1 className="text-2xl font-bold">My Wishlist</h1>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardContent className="flex items-center gap-4 p-4">
                                <Skeleton className="size-16 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/4" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-16">
                    <Heart className="size-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
                    <p className="text-muted-foreground mb-6">Save products you love for later.</p>
                    <Link href="/">
                        <Button>Browse Products</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <Card key={item.id}>
                            <CardContent className="flex items-center gap-4 p-4">
                                <Link href={`/products/${item.product_id}`}>
                                    {item.product.image_url ? (
                                        <Image
                                            src={imageUrl(item.product.image_url)}
                                            alt={item.product.name}
                                            width={64}
                                            height={64}
                                            className="size-16 rounded-lg object-cover"
                                            unoptimized={item.product.image_url.endsWith('.gif')}
                                        />
                                    ) : (
                                        <div className="size-16 rounded-lg bg-muted flex items-center justify-center">
                                            <Package className="size-6 text-muted-foreground" />
                                        </div>
                                    )}
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <Link href={`/products/${item.product_id}`} className="hover:underline">
                                        <h3 className="font-semibold truncate">{item.product.name}</h3>
                                    </Link>
                                    <p className="text-sm font-bold text-primary">
                                        ${item.product.price.toFixed(2)}
                                    </p>
                                </div>
                                <Button size="sm" onClick={() => moveToCart(item)}>
                                    <ShoppingCart className="size-4" />
                                    Add to Cart
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => removeItem(item.product_id)}
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
