"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { imageUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Package } from "lucide-react";

export default function CartPage() {
    const { items, removeFromCart, updateQuantity, totalAmount } = useCart();

    if (items.length === 0) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <ShoppingCart className="size-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
                <p className="text-muted-foreground mb-6">Add some products to get started</p>
                <Link href="/">
                    <Button>Browse Products</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-6">
                <ShoppingCart className="size-6" />
                <h1 className="text-2xl font-bold">Shopping Cart</h1>
                <span className="text-muted-foreground">({items.length} items)</span>
            </div>

            <div className="space-y-3">
                {items.map((item) => (
                    <Card key={item.product.id}>
                        <CardContent className="flex items-center gap-4 p-4">
                            {item.product.image_url ? (
                                <Image
                                    src={imageUrl(item.product.image_url)}
                                    alt={item.product.name}
                                    width={64}
                                    height={64}
                                    className="size-16 object-cover rounded-lg"
                                    unoptimized={item.product.image_url.endsWith('.gif')}
                                />
                            ) : (
                                <div className="size-16 rounded-lg bg-muted flex items-center justify-center">
                                    <Package className="size-6 text-muted-foreground" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate">{item.product.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    ${item.product.price.toFixed(2)} each
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8"
                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                >
                                    <Minus className="size-3" />
                                </Button>
                                <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8"
                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                >
                                    <Plus className="size-3" />
                                </Button>
                            </div>
                            <p className="font-semibold w-20 text-right">
                                ${(item.product.price * item.quantity).toFixed(2)}
                            </p>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive size-8"
                                onClick={() => removeFromCart(item.product.id)}
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Separator className="my-6" />

            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">Subtotal</p>
                    <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
                </div>
                <Link href="/checkout">
                    <Button size="lg">
                        Checkout
                        <ArrowRight className="size-4" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
