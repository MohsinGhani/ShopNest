"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiFetch, imageUrl } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, Check, ArrowLeft, Package, Star, Heart, Send } from "lucide-react";
import { toast } from "sonner";
import type { Product, Review } from "@/types";

export default function ProductDetailPage() {
    const params = useParams();
    const { addToCart } = useCart();
    const { user } = useAuth();
    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [error, setError] = useState("");
    const [added, setAdded] = useState(false);
    const [selectedImage, setSelectedImage] = useState("");
    const [wishlisted, setWishlisted] = useState(false);

    // Review form
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        apiFetch<Product>(`/products/${params.id}`)
            .then((p) => {
                setProduct(p);
                setSelectedImage(p.image_url);
            })
            .catch((e) => setError(e.message));

        apiFetch<Review[]>(`/products/${params.id}/reviews`)
            .then(setReviews)
            .catch(() => { });
    }, [params.id]);

    // Check wishlist status
    useEffect(() => {
        if (!user) return;
        apiFetch<number[]>("/wishlist/ids")
            .then((ids) => setWishlisted(ids.includes(Number(params.id))))
            .catch(() => { });
    }, [user, params.id]);

    const toggleWishlist = async () => {
        if (!user) { toast.error("Please sign in to use wishlist"); return; }
        try {
            if (wishlisted) {
                await apiFetch(`/wishlist/${params.id}`, { method: "DELETE" });
                setWishlisted(false);
                toast.success("Removed from wishlist");
            } else {
                await apiFetch(`/wishlist/${params.id}`, { method: "POST" });
                setWishlisted(true);
                toast.success("Added to wishlist");
            }
        } catch { toast.error("Failed to update wishlist"); }
    };

    const handleAdd = () => {
        if (!product) return;
        addToCart(product);
        setAdded(true);
        toast.success("Added to cart");
        setTimeout(() => setAdded(false), 1500);
    };

    const submitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) { toast.error("Please sign in to leave a review"); return; }
        setSubmittingReview(true);
        try {
            const review = await apiFetch<Review>(`/products/${params.id}/reviews`, {
                method: "POST",
                body: JSON.stringify({ rating, comment }),
            });
            setReviews((prev) => [review, ...prev]);
            setComment("");
            setRating(5);
            toast.success("Review submitted!");
            // Refresh product to update rating
            const updated = await apiFetch<Product>(`/products/${params.id}`);
            setProduct(updated);
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to submit review");
        } finally {
            setSubmittingReview(false);
        }
    };

    if (error) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                <Package className="size-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-destructive font-medium">{error}</p>
                <Link href="/">
                    <Button variant="outline" className="mt-4">
                        <ArrowLeft className="size-4" /> Back to Products
                    </Button>
                </Link>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-8">
                <Skeleton className="h-8 w-40 mb-6" />
                <div className="grid md:grid-cols-2 gap-8">
                    <Skeleton className="aspect-square rounded-lg" />
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-10 w-1/3" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-10 w-40" />
                    </div>
                </div>
            </div>
        );
    }

    const allImages = [
        product.image_url,
        ...product.images.map((img) => img.image_url),
    ].filter(Boolean);

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <Link href="/" className="mb-6 inline-block">
                <Button variant="ghost" size="sm">
                    <ArrowLeft className="size-4" /> Back to Products
                </Button>
            </Link>

            <Card className="overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                    {/* Image Gallery */}
                    <div className="p-4 space-y-3">
                        <div className="aspect-square overflow-hidden rounded-lg bg-muted relative">
                            {selectedImage ? (
                                <Image
                                    src={imageUrl(selectedImage)}
                                    alt={product.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-cover"
                                    priority
                                    unoptimized={selectedImage.endsWith('.gif')}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                    <Package className="size-20 opacity-20" />
                                </div>
                            )}
                        </div>
                        {allImages.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto">
                                {allImages.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(img)}
                                        className={`size-16 rounded-md overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-colors ${selectedImage === img ? "border-primary" : "border-transparent hover:border-muted-foreground/50"
                                            }`}
                                    >
                                        <Image src={imageUrl(img)} alt="" width={64} height={64} className="w-full h-full object-cover" unoptimized={img.endsWith('.gif')} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-3">
                            {product.category && (
                                <Badge variant="secondary">{product.category.name}</Badge>
                            )}
                            {product.is_featured && (
                                <Badge className="bg-yellow-500 text-white">Featured</Badge>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>

                        {product.review_count > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            className={`size-4 ${s <= Math.round(product.avg_rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {product.avg_rating} ({product.review_count} reviews)
                                </span>
                            </div>
                        )}

                        <p className="text-3xl font-extrabold text-primary mt-3">
                            ${product.price.toFixed(2)}
                        </p>
                        <Separator className="my-5" />
                        <p className="text-muted-foreground leading-relaxed">{product.description}</p>

                        <div className="flex gap-2 mt-6">
                            <Button
                                onClick={handleAdd}
                                size="lg"
                                className="flex-1"
                                variant={added ? "secondary" : "default"}
                            >
                                {added ? (
                                    <><Check className="size-4" /> Added</>
                                ) : (
                                    <><ShoppingCart className="size-4" /> Add to Cart</>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={toggleWishlist}
                            >
                                <Heart className={`size-4 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Reviews Section */}
            <div className="mt-10">
                <h2 className="text-2xl font-bold mb-6">Reviews</h2>

                {/* Review Form */}
                {user && (
                    <Card className="p-6 mb-6">
                        <h3 className="font-semibold mb-3">Write a Review</h3>
                        <form onSubmit={submitReview} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground block mb-2">Rating</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setRating(s)}
                                            className="cursor-pointer"
                                        >
                                            <Star
                                                className={`size-6 transition-colors ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground hover:text-yellow-300"}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <Textarea
                                placeholder="Share your thoughts about this product..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={3}
                            />
                            <Button type="submit" disabled={submittingReview}>
                                <Send className="size-4" />
                                {submittingReview ? "Submitting..." : "Submit Review"}
                            </Button>
                        </form>
                    </Card>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No reviews yet. Be the first to review!</p>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <Card key={review.id} className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star
                                                    key={s}
                                                    className={`size-3.5 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm font-medium">{review.user_email}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                {review.comment && (
                                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
