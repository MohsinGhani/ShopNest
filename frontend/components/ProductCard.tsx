import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { imageUrl } from "@/lib/api";
import { Star } from "lucide-react";

export default function ProductCard({ product }: { product: Product }) {
    return (
        <Link href={`/products/${product.id}`} className="group">
            <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 pt-0 gap-0">
                <div className="relative">
                    {product.image_url ? (
                        <div className="aspect-[4/3] overflow-hidden relative">
                            <Image
                                src={imageUrl(product.image_url)}
                                alt={product.name}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                className="object-cover transition-transform group-hover:scale-105"
                                unoptimized={product.image_url.endsWith('.gif')}
                            />
                        </div>
                    ) : (
                        <div className="aspect-[4/3] bg-muted flex items-center justify-center text-muted-foreground text-sm">
                            No image
                        </div>
                    )}
                    {product.category && (
                        <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
                            {product.category.name}
                        </Badge>
                    )}
                    {product.is_featured && (
                        <Badge className="absolute top-2 right-2 text-xs bg-yellow-500 text-white">
                            Featured
                        </Badge>
                    )}
                </div>
                <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{product.name}</h3>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-lg font-bold text-primary">
                            ${product.price.toFixed(2)}
                        </p>
                        {product.review_count > 0 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                                <span>{product.avg_rating}</span>
                                <span>({product.review_count})</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
