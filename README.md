# 🛍️ GK ShopEase — Frontend SPA

[![Live Demo](https://img.shields.io/badge/Live_Demo-AWS_CloudFront-blue?style=for-the-badge&logo=amazon-aws)](https://d1637jx31wm2nm.cloudfront.net)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![AWS S3](https://img.shields.io/badge/AWS_S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)
[![CloudFront](https://img.shields.io/badge/AWS_CloudFront-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/cloudfront/)
[![CI/CD](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/features/actions)

> Responsive, high-performance Single Page Application (SPA) for **GK ShopEase** e-commerce platform. Built with **React 18** and **Vite**, featuring an interactive **Google Gemini AI shopping assistant**, and deployed to **AWS S3 + CloudFront** via automated CI/CD.

---

## ✨ Features

- ⚡ **Blazing Fast UI:** Built with Vite and modern React 18 component architecture.
- 🤖 **Gemini AI Shopping Assistant:** Real-time conversational interface suggesting products based on user queries and budgets.
- 🔐 **JWT Authentication:** Secure client-side session handling, token storage, and route protection.
- 🛒 **Dynamic Cart & Checkout:** Real-time quantity adjustments, state persistence, and order placement.
- 👑 **Admin Portal:** Dedicated management views for catalog updates and order tracking.
- ☁️ **Edge Delivery:** Hosted on Amazon S3 and distributed globally via Amazon CloudFront with SSL/TLS encryption.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Framework & Build** | React 18, Vite |
| **Styling** | SCSS / CSS Modules, Responsive Flexbox/Grid |
| **HTTP Client** | Axios (with JWT interceptors) |
| **Icons & Assets** | Lucide React |
| **Hosting & CDN** | AWS S3, Amazon CloudFront |
| **CI/CD** | GitHub Actions |

---

## 📁 Project Structure

```text
E-Commerce-FRONTEND/
├── .github/workflows/
│   └── deploy.yml          # Automated S3 sync & CloudFront cache invalidation
├── public/                 # Static assets & favicon
├── src/
│   ├── assets/             # Images, styling variables
│   ├── components/         # Reusable UI components (Navbar, Cart, ChatWidget, ProductCard)
│   ├── context/            # Global state (AuthContext, CartContext)
│   ├── pages/              # View routes (Home, Products, Admin, Checkout)
│   ├── services/           # Axios API connectors
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── vite.config.js


🚀 Local Setup
1. Prerequisites
Node.js (v20 or later)

npm or yarn

2. Installation
Bash
# Clone the repository
git clone [https://github.com/gokulkrishna12/E-Commerce-FRONTEND.git](https://github.com/gokulkrishna12/E-Commerce-FRONTEND.git)
cd E-Commerce-FRONTEND

# Install dependencies
npm install

# Start development server
npm run dev
🔄 CI/CD Pipeline
Every push to the main branch triggers .github/workflows/deploy.yml:

Checks out repository and configures Node.js.

Runs npm run build to generate the production dist/ bundle.

Authenticates with AWS credentials stored in GitHub Secrets.

Syncs the build to the Amazon S3 bucket.

Issues an invalidation (/*) across the Amazon CloudFront distribution for instant cache refresh.

👨‍💻 Author
Gokul Krishna

GitHub: @gokulkrishna12

LinkedIn: gokulkrishna08