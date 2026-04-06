"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, imageUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { OrderDetail } from "@/types";

export default function OrdersPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<OrderDetail[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { router.push("/login"); return; }
        apiFetch<OrderDetail[]>("/orders/my")
            .then(setOrders)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [user, router]);

    if (!user) return null;

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-6">
                <ClipboardList className="size-6" />
                <h1 className="text-2xl font-bold">My Orders</h1>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-5 w-40" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-16 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-16">
                    <ShoppingBag className="size-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
                    <p className="text-muted-foreground mb-6">Start shopping and your orders will appear here.</p>
                    <Link href="/">
                        <Button>Browse Products</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <Card key={order.id}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">
                                        Order #{order.id}
                                    </CardTitle>
                                    <div className="text-right text-sm">
                                        <p className="font-semibold">${order.total_amount.toFixed(2)}</p>
                                        <p className="text-muted-foreground">
                                            {new Date(order.created_at).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3">
                                            {item.product.image_url ? (
                                                <Image
                                                    src={imageUrl(item.product.image_url)}
                                                    alt={item.product.name}
                                                    width={48}
                                                    height={48}
                                                    className="size-12 rounded-md object-cover"
                                                    unoptimized={item.product.image_url.endsWith('.gif')}
                                                />
                                            ) : (
                                                <div className="size-12 rounded-md bg-muted flex items-center justify-center">
                                                    <Package className="size-5 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{item.product.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Qty: {item.quantity} × ${item.price.toFixed(2)}
                                                </p>
                                            </div>
                                            <p className="font-semibold text-sm">
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
