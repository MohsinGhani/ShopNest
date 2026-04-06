"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShoppingCart, LogOut, Store, LayoutDashboard, LogIn, Heart, ClipboardList, UserCircle } from "lucide-react";

export default function Navbar() {
    const { user, logout } = useAuth();
    const { items } = useCart();
    const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

    return (
        <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                    <Store className="size-5" />
                    ShopDemo
                </Link>

                <div className="flex items-center gap-1">
                    <Link href="/">
                        <Button variant="ghost">Products</Button>
                    </Link>

                    {user && (
                        <>
                            <Link href="/wishlist">
                                <Button variant="ghost">
                                    <Heart className="size-4" />
                                    <span className="hidden sm:inline">Wishlist</span>
                                </Button>
                            </Link>
                            <Link href="/orders">
                                <Button variant="ghost">
                                    <ClipboardList className="size-4" />
                                    <span className="hidden sm:inline">Orders</span>
                                </Button>
                            </Link>
                        </>
                    )}

                    <Link href="/cart" className="relative">
                        <Button variant="ghost">
                            <ShoppingCart className="size-4" />
                            Cart
                            {cartCount > 0 && (
                                <Badge className="absolute -top-1 -right-1 size-5 p-0 flex items-center justify-center text-[10px]">
                                    {cartCount}
                                </Badge>
                            )}
                        </Button>
                    </Link>

                    {user?.role === "admin" && (
                        <Link href="/admin">
                            <Button variant="ghost">
                                <LayoutDashboard className="size-4" />
                                Admin
                            </Button>
                        </Link>
                    )}

                    <ThemeToggle />

                    {user ? (
                        <div className="flex items-center gap-1">
                            <Link href="/profile">
                                <Button variant="ghost" size="icon">
                                    <UserCircle className="size-4" />
                                </Button>
                            </Link>
                            <Button variant="outline" size="sm" onClick={logout}>
                                <LogOut className="size-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </div>
                    ) : (
                        <Link href="/login">
                            <Button size="sm">
                                <LogIn className="size-4" />
                                Login
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
