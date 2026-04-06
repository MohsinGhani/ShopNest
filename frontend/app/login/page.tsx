"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LogIn, KeyRound } from "lucide-react";
import type { LoginResponse } from "@/types";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await apiFetch<LoginResponse>("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            login(data.access_token, {
                user_id: data.user_id,
                email: data.email,
                role: data.role,
            });

            router.push(data.role === "admin" ? "/admin" : "/");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
                        <KeyRound className="size-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Welcome back</CardTitle>
                    <CardDescription>Sign in to your account to continue</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            <LogIn className="size-4" />
                            {loading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>

                    <Separator className="my-6" />

                    <div className="space-y-2">
                        <p className="text-sm font-medium text-center text-muted-foreground">Demo Credentials</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <button
                                type="button"
                                onClick={() => { setEmail("admin@example.com"); setPassword("admin123"); }}
                                className="p-2 rounded-lg border bg-muted/50 hover:bg-muted text-left transition-colors cursor-pointer"
                            >
                                <span className="font-semibold block">Admin</span>
                                <span className="text-muted-foreground">admin@example.com</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setEmail("user@example.com"); setPassword("user123"); }}
                                className="p-2 rounded-lg border bg-muted/50 hover:bg-muted text-left transition-colors cursor-pointer"
                            >
                                <span className="font-semibold block">User</span>
                                <span className="text-muted-foreground">user@example.com</span>
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
