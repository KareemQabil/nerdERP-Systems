# NerdERP - Enterprise Resource Planning System

![NerdERP](https://img.shields.io/badge/NerdERP-v2.0.0-cyan?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)

> **Modern, Scalable, ZATCA-Compliant ERP System for Saudi Arabia**

NerdERP is a comprehensive Enterprise Resource Planning system built for restaurants and retail businesses, featuring a beautiful point-of-sale interface, real-time inventory management, and full ZATCA Phase 2 compliance for Saudi e-invoicing.

---

## 🌟 Features

### 📱 **Point of Sale (POS)**
- **Glassmorphic UI** with RTL support for Arabic
- **Real-time Order Management** with kitchen display integration
- **Multiple Payment Methods** (Cash, Card, Split payments)
- **Table Management** for dine-in orders
- **Order Types**: Takeaway, Dine-in, Delivery
- **Product Modifiers** and customizations
- **Hold/Resume Orders** for busy periods
- **Barcode Scanner** support

### 📦 **Inventory Management**
- **FIFO Inventory Costing** with batch tracking
- **Multi-level Bill of Materials (BOM)** for recipes
- **Real-time Stock Tracking** across warehouses
- **Purchase Orders** and supplier management
- **Stock Movement** audit trail
- **Low Stock Alerts**

### 💰 **Financial Management**
- **ZATCA Phase 2 Compliance** (Saudi E-Invoicing)
- **Cryptographic Hash Chain** for invoice integrity
- **QR Code Generation** (TLV format)
- **Register Session Management**
- **Cash Flow Tracking**
- **Discount Management**

### 👥 **Customer Management**
- **Customer Profiles** with contact information
- **Loyalty Points** system
- **Purchase History** tracking
- **Customer Analytics**

###⚙️ **System Features**
- **Multi-warehouse Support**
- **Arabic/English** bilingual interface
- **Audit Logging** for all transactions
- **Role-Based Access Control** (RBAC)
- **RESTful API** architecture
- **WebSocket** real-time updates

---

## 🏗️ Architecture

### **Backend** - NestJS + TypeORM + PostgreSQL
```
nestJSBackend/
├── src/
│   ├── modules/
│   │   ├── sales/          # Sales & POS
│   │   ├── inventory/      # Stock management
│   │   ├── products/       # Product catalog
│   │   ├── customers/      # CRM
│   │   ├── zatca/          # E-invoicing compliance
│   │   └── auth/           # Authentication
│   ├── common/             # Shared utilities
│   └── config/             # Configuration
├── prisma/                 # Database schema
└── package.json
```

### **Frontend** - React + Vite + TypeScript
```
ReactVite Frontend/
├── src/
│   ├── modules/
│   │   ├── sales/          # POS interface
│   │   ├── products/       # Product management
│   │   ├── inventory/      # Stock views
│   │   └── customers/      # Customer management
│   ├── shared/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Helper functions
│   └── assets/             # Images, fonts, styles
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **PostgreSQL** 14+
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/KareemQabil/nerdERP-Systems.git
cd nerdERP-Systems
```

### 2. Backend Setup
```bash
cd nestJSBackend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
npm run migration:run

# Seed database (optional)
npm run seed

# Start development server
npm run start:dev
```

Backend will run on `http://localhost:3000`

### 3. Frontend Setup
```bash
cd "ReactVite Frontend"

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env to point to backend API

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

---

## 📝 Environment Variables

### Backend (`.env`)
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=nerderp

# JWT Security
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# ZATCA E-Invoicing
ZATCA_ENVIRONMENT=sandbox
ZATCA_DEVICE_ID=your_device_id
ZATCA_CERTIFICATE_PATH=./certs/zatca_cert.pem
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000
VITE_ENABLE_MOCK_DATA=false
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **NestJS** | Node.js framework |
| **TypeORM** | ORM for PostgreSQL |
| **PostgreSQL** | Relational database |
| **Class Validator** | DTO validation |
| **Passport JWT** | Authentication |
| **Swagger** | API documentation |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI library |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **TanStack Query** | Server state management |
| **Zustand** | Client state management |
| **Shadcn/UI** | Component library |
| **Tailwind CSS** | Styling |
| **Framer Motion** | Animations |
| **React Hook Form** | Form handling |
| **Zod** | Schema validation |
| **Decimal.js** | Precision arithmetic |
| **i18next** | Internationalization |

---

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:3000/api/docs`
- **OpenAPI JSON**: `http://localhost:3000/api/docs-json`

### Key Endpoints
```
POST   /api/auth/login              # User authentication
GET    /api/products                # List products
POST   /api/sales/orders            # Create order
POST   /api/sales/orders/:id/pay    # Process payment
GET    /api/inventory/stock         # Stock levels
POST   /api/zatca/generate-invoice  # Generate ZATCA invoice
```

---

## 🎨 UI/UX Design

NerdERP features a **modern glassmorphic design** optimized for:
- **Touchscreen Devices** (tablets, all-in-one POS terminals)
- **RTL Support** for Arabic language
- **Accessibility** (WCAG 2.1 compliant)
- **Responsive Design** (mobile, tablet, desktop)
- **Dark Mode** optimized for low-light environments

### Color Palette
- **Primary**: Cyan (#22D3EE)
- **Background**: Dark gradient (#0A1929 → #132F4C)
- **Surface**: Glassmorphic with blur effects
- **Text**: High contrast for readability

---

## 🔒 Security

- **JWT Authentication** with refresh tokens
- **Role-Based Access Control** (RBAC)
- **SQL Injection Protection** via TypeORM
- **XSS Prevention** via React's built-in sanitization
- **CORS Configuration** for API security
- **Rate Limiting** on sensitive endpoints
- **Audit Logging** for all transactions

---

## 📦 Database Schema

### Core Tables
- `users` - System users and authentication
- `products` - Product catalog
- `categories` - Product categories
- `sales_orders` - Sales transactions
- `order_items` - Order line items
- `payments` - Payment records
- `inventory_batches` - Stock batches (FIFO)
- `stock_moves` - Inventory movements
- `customers` - Customer profiles
- `zatca_invoices` - E-invoicing records

### Decimal Precision
- **Money/Prices**: `DECIMAL(10,3)` - up to 9,999,999.999 SAR
- **Quantities**: `DECIMAL(10,3)` - supports fractional units
- **Tax Rates**: `DECIMAL(5,2)` - e.g., 15.00%

---

## 🧪 Testing

### Backend Tests
```bash
cd nestJSBackend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Frontend Tests
```bash
cd "ReactVite Frontend"

# Component tests
npm run test

# E2E tests (Playwright)
npm run test:e2e
```

---

## 🚢 Deployment

### Production Build

**Backend**:
```bash
cd nestJSBackend
npm run build
npm run start:prod
```

**Frontend**:
```bash
cd "ReactVite Frontend"
npm run build
# Serve from dist/ folder
```

### Deployment Options
- **Docker** (Recommended) - `docker-compose.yml` included
- **PM2** for Node.js process management
- **Nginx** for reverse proxy
- **AWS/Azure/GCP** cloud platforms
- **Vercel/Netlify** for frontend

---

## 📖 Documentation

Comprehensive documentation available in `/docs`:
- `FRONTEND_BLUEPRINT.md` - Frontend architecture guide
- `API_STANDARDS.md` - API design principles
- `Design_System.md` - UI/UX guidelines
- `LOGIC_ENGINE.md` - Business logic documentation
- `nestJS structure.md` - Backend architecture

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- **Backend**: Follow NestJS conventions
- **Frontend**: Use ESLint + Prettier configuration
- **Commits**: Use conventional commits format

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Authors

- **Kareem Qabil** - *Initial work* - [@KareemQabil](https://github.com/KareemQabil)

---

## 🙏 Acknowledgments

- **ZATCA** (Zakat, Tax and Customs Authority) for e-invoicing standards
- **NestJS** team for the excellent framework
- **React** team for the powerful UI library
- **Shadcn** for beautiful UI components
- **Tailwind CSS** for rapid styling

---

## 📞 Support

For support, email support@nerderp.com or open an issue on GitHub.

---

## 🗺️ Roadmap

### Version 2.1 (Q1 2025)
- [ ] Mobile app (React Native)
- [ ] Advanced reporting dashboard
- [ ] Multi-currency support
- [ ] Supplier portal

### Version 3.0 (Q2 2025)
- [ ] AI-powered inventory forecasting
- [ ] Integration with accounting software
- [ ] WhatsApp order notifications
- [ ] Multi-location franchise management

---

<div align="center">

**Built with ❤️ for Saudi businesses**

[Website](https://nerderp.com) • [Documentation](https://docs.nerderp.com) • [GitHub](https://github.com/KareemQabil/nerdERP-Systems)

</div>
