import { Store } from "lucide-react";
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t bg-background mt-auto">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <div>
                        <div className="flex items-center gap-2 font-bold text-lg mb-3">
                            <Store className="size-5" />
                            ShopDemo
                        </div>
                        <p className="text-sm text-muted-foreground">
                            A demo e-commerce application built with Next.js and FastAPI.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-3">Quick Links</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/" className="hover:text-foreground transition-colors">Products</Link></li>
                            <li><Link href="/cart" className="hover:text-foreground transition-colors">Cart</Link></li>
                            <li><Link href="/wishlist" className="hover:text-foreground transition-colors">Wishlist</Link></li>
                            <li><Link href="/orders" className="hover:text-foreground transition-colors">My Orders</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-3">Account</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/profile" className="hover:text-foreground transition-colors">Profile</Link></li>
                            <li><Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} ShopDemo. Built for demonstration purposes.
                </div>
            </div>
        </footer>
    );
}
