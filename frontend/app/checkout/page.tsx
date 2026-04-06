"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, ShoppingBag, LogIn, CreditCard } from "lucide-react";
import type { OrderResponse } from "@/types";

export default function CheckoutPage() {
    const { user } = useAuth();
    const { items, totalAmount, clearCart } = useCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [orderId, setOrderId] = useState<number | null>(null);

    if (!user) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center">
                <LogIn className="size-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
                <p className="text-muted-foreground mb-6">Please log in to complete your purchase.</p>
                <Link href="/login">
                    <Button>Sign In</Button>
                </Link>
            </div>
        );
    }

    if (orderId) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center">
                <div className="mx-auto bg-green-500/10 p-4 rounded-full w-fit mb-4">
                    <CheckCircle2 className="size-12 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
                <p className="text-muted-foreground mb-1">Order #{orderId}</p>
                <p className="text-muted-foreground mb-6">Thank you for your purchase.</p>
                <Link href="/">
                    <Button>Continue Shopping</Button>
                </Link>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center">
                <ShoppingBag className="size-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h1 className="text-2xl font-bold mb-2">Nothing to checkout</h1>
                <p className="text-muted-foreground mb-6">Your cart is empty.</p>
                <Link href="/">
                    <Button variant="outline">Browse Products</Button>
                </Link>
            </div>
        );
    }

    const handleCheckout = async () => {
        setError("");
        setLoading(true);

        try {
            const order = await apiFetch<OrderResponse>("/checkout", {
                method: "POST",
                body: JSON.stringify({
                    items: items.map((i) => ({
                        product_id: i.product.id,
                        quantity: i.quantity,
                    })),
                }),
            });
            setOrderId(order.id);
            clearCart();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Checkout failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-6">
                <CreditCard className="size-6" />
                <h1 className="text-2xl font-bold">Checkout</h1>
            </div>

            {error && (
                <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                    <CardDescription>{items.length} items</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {items.map((item) => (
                        <div key={item.product.id} className="flex justify-between items-center text-sm">
                            <div>
                                <span className="font-medium">{item.product.name}</span>
                                <span className="text-muted-foreground"> × {item.quantity}</span>
                            </div>
                            <span className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}

                    <Separator />

                    <div className="flex justify-between items-center font-bold text-lg">
                        <span>Total</span>
                        <span>${totalAmount.toFixed(2)}</span>
                    </div>

                    <Button
                        onClick={handleCheckout}
                        disabled={loading}
                        size="lg"
                        className="w-full mt-2"
                    >
                        <CreditCard className="size-4" />
                        {loading ? "Placing Order..." : `Pay $${totalAmount.toFixed(2)}`}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center pt-1">
                        Demo only — no real payment processed.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
