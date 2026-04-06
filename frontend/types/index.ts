export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface ProductImage {
  id: number;
  image_url: string;
  sort_order: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: number | null;
  is_featured: boolean;
  created_at: string | null;
  category: Category | null;
  images: ProductImage[];
  avg_rating: number;
  review_count: number;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  user_id: number;
  email: string;
  role: string;
}

export interface UserProfile {
  id: number;
  email: string;
  role: string;
  name: string;
  created_at: string;
  order_count: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  email: string;
  role: string;
}

export interface OrderResponse {
  id: number;
  total_amount: number;
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product: Product;
}

export interface OrderDetail {
  id: number;
  user_id: number;
  user_email: string;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  user_email: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface WishlistItem {
  id: number;
  product_id: number;
  product: Product;
  created_at: string;
}
