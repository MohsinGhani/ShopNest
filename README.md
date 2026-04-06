# E-Commerce Demo Application

A simple e-commerce demo built with **Next.js + TypeScript** (frontend) and **FastAPI + Python** (backend).

## 📁 Project Structure

```
project-root/
├── frontend/                 # Next.js frontend
│   ├── app/                  # Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Landing page
│   │   ├── login/page.tsx
│   │   ├── admin/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   └── products/
│   │       └── [id]/page.tsx # Product details
│   ├── components/           # React components
│   │   ├── Navbar.tsx
│   │   └── ProductCard.tsx
│   ├── lib/                  # Utilities
│   │   ├── api.ts
│   │   ├── auth-context.tsx
│   │   └── cart-context.tsx
│   ├── types/                # TypeScript types
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── .env.local.example
│
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI app entry
│   │   ├── database.py       # SQLAlchemy setup
│   │   ├── models.py         # Database models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── crud.py           # CRUD operations
│   │   ├── auth.py           # JWT authentication
│   │   ├── seed.py           # Demo data seeding
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── products.py
│   │       └── checkout.py
│   ├── requirements.txt
│   └── .env.example
│
└── README.md
```

## ✨ Features

- **Landing Page** - Browse all products
- **Product Details** - View product info and add to cart
- **User Authentication** - JWT-based login with role support
- **Admin Dashboard** - Create new products (admin only)
- **Shopping Cart** - Add/remove items, adjust quantities
- **Checkout** - Place orders (simulated)

## 🛠 Tech Stack

### Frontend
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- React Context for state management

### Backend
- FastAPI
- Python 3.11+
- SQLAlchemy ORM
- SQLite database
- JWT authentication
- Pydantic validation

## 🚀 Quick Start

### Backend Setup

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Mac/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create environment file:**
   ```bash
   copy .env.example .env    # Windows
   cp .env.example .env      # Mac/Linux
   ```

5. **Run the server (auto-creates database and seeds data):**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

   The API will be available at: `http://localhost:8000`
   API docs at: `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend folder:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   copy .env.local.example .env.local    # Windows
   cp .env.local.example .env.local      # Mac/Linux
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at: `http://localhost:3000`

## 🔑 Demo Credentials

| Role  | Email               | Password   |
|-------|---------------------|------------|
| Admin | admin@example.com   | admin123   |
| User  | user@example.com    | user123    |

## 📡 API Endpoints

### Authentication
| Method | Endpoint      | Description    | Auth     |
|--------|---------------|----------------|----------|
| POST   | /auth/login   | User login     | No       |

### Products
| Method | Endpoint        | Description        | Auth       |
|--------|-----------------|--------------------|-----------| 
| GET    | /products       | List all products  | No         |
| GET    | /products/{id}  | Get product details| No         |
| POST   | /products       | Create product     | Admin only |

### Checkout
| Method | Endpoint   | Description    | Auth     |
|--------|------------|----------------|----------|
| POST   | /checkout  | Place an order | User     |

## 🎨 Pages

| Route              | Description              | Access     |
|--------------------|--------------------------|------------|
| /                  | Landing page             | Public     |
| /products/[id]     | Product details          | Public     |
| /login             | Login page               | Public     |
| /cart              | Shopping cart            | Public     |
| /checkout          | Checkout page            | Logged in  |
| /admin             | Admin dashboard          | Admin only |

## 🔮 Future Improvements

- User registration
- Product categories and search
- Order history page
- Product edit/delete in admin
- Product image upload
- Payment gateway integration
- Email notifications
- Docker containerization
- Unit and integration tests

## 📝 License

MIT License - feel free to use this as a starter project!
