"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, imageUrl as resolveImg } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Package, Upload, ImageIcon, ShoppingBag, X, Pencil, Save, Trash2, Tag, Star } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import type { Product, OrderDetail, PaginatedProducts, Category } from "@/types";

export default function AdminPage() {
    const { user } = useAuth();
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);

    const [tab, setTab] = useState<"products" | "orders" | "categories">("products");
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<OrderDetail[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [isFeatured, setIsFeatured] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Edit state
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const editFileRef = useRef<HTMLInputElement>(null);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editPrice, setEditPrice] = useState("");
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
    const [editCategoryId, setEditCategoryId] = useState("");
    const [editIsFeatured, setEditIsFeatured] = useState(false);
    const [editError, setEditError] = useState("");
    const [editSubmitting, setEditSubmitting] = useState(false);

    // New category state
    const [newCatName, setNewCatName] = useState("");
    const [newCatSlug, setNewCatSlug] = useState("");
    const [catSubmitting, setCatSubmitting] = useState(false);

    useEffect(() => {
        if (!user) { router.push("/login"); return; }
        if (user.role !== "admin") { router.push("/"); return; }
        loadProducts();
        loadOrders();
        loadCategories();
    }, [user, router]);

    const loadProducts = () => {
        apiFetch<PaginatedProducts>("/products?page=1&per_page=100").then((data) => setProducts(data.items)).catch(() => { });
    };

    const loadOrders = () => {
        apiFetch<OrderDetail[]>("/orders").then(setOrders).catch(() => { });
    };

    const loadCategories = () => {
        apiFetch<Category[]>("/categories").then(setCategories).catch(() => { });
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const clearImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileRef.current) fileRef.current.value = "";
    };

    const openEdit = (p: Product) => {
        setEditProduct(p);
        setEditName(p.name);
        setEditDescription(p.description);
        setEditPrice(p.price.toString());
        setEditCategoryId(p.category_id ? p.category_id.toString() : "");
        setEditIsFeatured(p.is_featured);
        setEditImageFile(null);
        setEditImagePreview(p.image_url ? resolveImg(p.image_url) : null);
        setEditError("");
    };

    const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setEditImageFile(file);
        const reader = new FileReader();
        reader.onload = () => setEditImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const confirmDelete = async () => {
        if (deleteId === null) return;
        setDeleting(true);
        try {
            await apiFetch(`/products/${deleteId}`, { method: "DELETE" });
            loadProducts();
            toast.success("Product deleted");
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to delete product");
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editProduct) return;
        setEditError(""); setEditSubmitting(true);

        try {
            let newImageUrl: string | undefined;
            if (editImageFile) {
                const fd = new FormData();
                fd.append("file", editImageFile);
                const res = await apiFetch<{ url: string }>("/upload", { method: "POST", body: fd });
                newImageUrl = res.url;
            }

            await apiFetch<Product>(`/products/${editProduct.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    name: editName,
                    description: editDescription,
                    price: parseFloat(editPrice),
                    category_id: editCategoryId ? parseInt(editCategoryId) : null,
                    is_featured: editIsFeatured,
                    ...(newImageUrl !== undefined && { image_url: newImageUrl }),
                }),
            });

            setEditProduct(null);
            loadProducts();
            toast.success("Product updated");
        } catch (e: unknown) {
            setEditError(e instanceof Error ? e.message : "Failed to update product");
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            let uploadedUrl = "";
            if (imageFile) {
                const fd = new FormData();
                fd.append("file", imageFile);
                const res = await apiFetch<{ url: string }>("/upload", {
                    method: "POST",
                    body: fd,
                });
                uploadedUrl = res.url;
            }

            await apiFetch<Product>("/products", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    description,
                    price: parseFloat(price),
                    image_url: uploadedUrl,
                    category_id: categoryId ? parseInt(categoryId) : null,
                    is_featured: isFeatured,
                }),
            });

            toast.success("Product created successfully!");
            setName(""); setDescription(""); setPrice(""); setCategoryId(""); setIsFeatured(false);
            clearImage();
            loadProducts();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to create product");
        } finally {
            setSubmitting(false);
        }
    };

    if (!user || user.role !== "admin") return null;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Manage products and view orders</p>
                </div>
                <Badge variant="outline" className="text-sm">{user.email}</Badge>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-muted p-1 rounded-lg w-fit">
                <button
                    onClick={() => setTab("products")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${tab === "products" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                    <Package className="size-4 inline mr-1.5 -mt-0.5" />
                    Products
                </button>
                <button
                    onClick={() => setTab("orders")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${tab === "orders" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                    <ShoppingBag className="size-4 inline mr-1.5 -mt-0.5" />
                    Orders
                    {orders.length > 0 && (
                        <Badge className="ml-1.5 text-[10px] px-1.5">{orders.length}</Badge>
                    )}
                </button>
                <button
                    onClick={() => setTab("categories")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${tab === "categories" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                    <Tag className="size-4 inline mr-1.5 -mt-0.5" />
                    Categories
                </button>
            </div>

            {tab === "products" && (
                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Create Product Form */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="size-5" /> New Product
                            </CardTitle>
                            <CardDescription>Add a product to your store</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Product Name</Label>
                                    <Input id="name" placeholder="e.g. Wireless Mouse" value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="desc">Description</Label>
                                    <Textarea id="desc" placeholder="Describe the product..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price">Price ($)</Label>
                                    <Input id="price" type="number" step="0.01" min="0" placeholder="29.99" value={price} onChange={(e) => setPrice(e.target.value)} required />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <select
                                        id="category"
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                        className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                                    >
                                        <option value="">No category</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="featured"
                                        checked={isFeatured}
                                        onChange={(e) => setIsFeatured(e.target.checked)}
                                        className="size-4 rounded border"
                                    />
                                    <Label htmlFor="featured" className="flex items-center gap-1">
                                        <Star className="size-3.5 text-yellow-500" /> Featured Product
                                    </Label>
                                </div>

                                <div className="space-y-2">
                                    <Label>Product Image</Label>
                                    {imagePreview ? (
                                        <div className="relative rounded-lg overflow-hidden border">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                                            <button type="button" onClick={clearImage} className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background cursor-pointer">
                                                <X className="size-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => fileRef.current?.click()}
                                            className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
                                        >
                                            <Upload className="size-6" />
                                            <span className="text-sm">Click to upload image</span>
                                            <span className="text-xs">JPEG, PNG, GIF, WebP (max 5MB)</span>
                                        </button>
                                    )}
                                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                                </div>

                                <Button type="submit" className="w-full" disabled={submitting}>
                                    <Plus className="size-4" />
                                    {submitting ? "Creating..." : "Create Product"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Product List */}
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>All Products</CardTitle>
                            <CardDescription>{products.length} products in store</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-2">
                                {products.map((p) => (
                                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                                        {p.image_url ? (
                                            <Image src={resolveImg(p.image_url)} alt={p.name} width={48} height={48} className="size-12 rounded-md object-cover" unoptimized={p.image_url.endsWith('.gif')} />
                                        ) : (
                                            <div className="size-12 rounded-md bg-muted flex items-center justify-center">
                                                <ImageIcon className="size-5 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="font-medium truncate">{p.name}</p>
                                                {p.is_featured && <Star className="size-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                                            </div>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                {p.category && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{p.category.name}</Badge>}
                                                <span className="text-xs text-muted-foreground truncate">{p.description || "No description"}</span>
                                            </div>
                                        </div>
                                        <span className="font-semibold text-sm whitespace-nowrap">${p.price.toFixed(2)}</span>
                                        <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(p)}>
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)}>
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                ))}
                                {products.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Package className="size-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No products yet</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {tab === "orders" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                        <CardDescription>{orders.length} orders placed</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {orders.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <ShoppingBag className="size-10 mx-auto mb-3 opacity-30" />
                                <p>No orders yet</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Items</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-right">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-sm">#{order.id}</TableCell>
                                            <TableCell>{order.user_email}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {order.items.map((item) => (
                                                        <Badge key={item.id} variant="secondary" className="text-xs">
                                                            {item.product.name} × {item.quantity}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">${order.total_amount.toFixed(2)}</TableCell>
                                            <TableCell className="text-right text-sm text-muted-foreground">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}

            {tab === "categories" && (
                <Card className="max-w-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="size-5" /> Categories
                        </CardTitle>
                        <CardDescription>Manage product categories</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setCatSubmitting(true);
                                try {
                                    await apiFetch("/categories", {
                                        method: "POST",
                                        body: JSON.stringify({
                                            name: newCatName,
                                            slug: newCatSlug || newCatName.toLowerCase().replace(/\s+/g, "-"),
                                        }),
                                    });
                                    setNewCatName("");
                                    setNewCatSlug("");
                                    loadCategories();
                                    toast.success("Category created");
                                } catch {
                                    toast.error("Failed to create category");
                                } finally {
                                    setCatSubmitting(false);
                                }
                            }}
                            className="flex gap-2"
                        >
                            <Input
                                placeholder="Category name"
                                value={newCatName}
                                onChange={(e) => {
                                    setNewCatName(e.target.value);
                                    setNewCatSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                                }}
                                required
                            />
                            <Button type="submit" disabled={catSubmitting}>
                                <Plus className="size-4" />
                                Add
                            </Button>
                        </form>
                        <Separator />
                        <div className="space-y-2">
                            {categories.map((cat) => (
                                <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div>
                                        <span className="font-medium">{cat.name}</span>
                                        <span className="text-xs text-muted-foreground ml-2">/{cat.slug}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 text-destructive hover:text-destructive"
                                        onClick={async () => {
                                            try {
                                                await apiFetch(`/categories/${cat.id}`, { method: "DELETE" });
                                                loadCategories();
                                                toast.success("Category deleted");
                                            } catch {
                                                toast.error("Failed to delete category");
                                            }
                                        }}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            ))}
                            {categories.length === 0 && (
                                <p className="text-center py-6 text-muted-foreground text-sm">No categories yet</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Edit Product Dialog */}
            <Dialog open={!!editProduct} onOpenChange={(open) => { if (!open) setEditProduct(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                        <DialogDescription>Update the product details below</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        {editError && (
                            <div className="text-sm p-3 rounded-lg bg-destructive/10 text-destructive">
                                {editError}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-desc">Description</Label>
                            <Textarea id="edit-desc" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-price">Price ($)</Label>
                            <Input id="edit-price" type="number" step="0.01" min="0" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-category">Category</Label>
                            <select
                                id="edit-category"
                                value={editCategoryId}
                                onChange={(e) => setEditCategoryId(e.target.value)}
                                className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="">No category</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="edit-featured"
                                checked={editIsFeatured}
                                onChange={(e) => setEditIsFeatured(e.target.checked)}
                                className="size-4 rounded border"
                            />
                            <Label htmlFor="edit-featured" className="flex items-center gap-1">
                                <Star className="size-3.5 text-yellow-500" /> Featured
                            </Label>
                        </div>

                        <div className="space-y-2">
                            <Label>Image</Label>
                            {editImagePreview ? (
                                <div className="relative rounded-lg overflow-hidden border">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={editImagePreview} alt="Preview" className="w-full h-36 object-cover" />
                                    <button type="button" onClick={() => { setEditImageFile(null); setEditImagePreview(null); if (editFileRef.current) editFileRef.current.value = ""; }} className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background cursor-pointer">
                                        <X className="size-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => editFileRef.current?.click()}
                                    className="w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
                                >
                                    <Upload className="size-5" />
                                    <span className="text-xs">Upload new image</span>
                                </button>
                            )}
                            <input ref={editFileRef} type="file" accept="image/*" onChange={handleEditImageSelect} className="hidden" />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditProduct(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1" disabled={editSubmitting}>
                                <Save className="size-4" />
                                {editSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Product</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this product? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                            <Trash2 className="size-4" />
                            {deleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
