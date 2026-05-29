# 💊 AriaHealth Pharmacy Management System

## 🧑‍💻 Developer Documentation (Full Guide)

---

## 📌 Overview
AriaHealth Pharmacy Management System is a full-stack web application designed to automate pharmacy operations such as medicine inventory, sales, prescriptions, suppliers, customers, billing, and reporting.

This document is for developers to understand how the system works internally and how to set it up, develop, and maintain it.

---

## 🏗️ System Architecture

The system follows a **3-tier architecture**:
Frontend (React + Vite + Tailwind CSS)
↓ REST API
Backend (Node.js + Express.js)
↓
Database (MySQL)


---

## 📁 Project Structure


AriaHealthPharmacy/
│
├── client/ # Frontend (React + Vite)
│ ├── src/
│ ├── components/
│ ├── pages/
│ └── main.jsx
│
├── server/ # Backend (Node.js + Express)
│ ├── routes/
│ ├── controllers/
│ ├── models/
│ ├── middleware/
│ ├── config/
│ └── server.js
│
├── database/ # SQL scripts
├── .env # Environment variables
├── README.md # User documentation
└── README-dev.md # Developer documentation


---

## 🚀 Installation & Setup (Development)

### 1️⃣ Clone Repository
```bash
git clone https://github.com/abtesfa/Ariapharmacymgmt.git
cd Ariapharmacymgmt

2️⃣ Install Dependencies (Frontend + Backend)
cd client && npm install
cd ../server && npm install

3️⃣ Setup Environment Variables

Create .env inside /server:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pharmacy_db
PORT=5000
JWT_SECRET=your_secret_key

4️⃣ Run Development Servers
Backend
cd server
npm run dev

Frontend
cd client
npm run dev

🌐 Application URLs
Frontend: http://localhost:5173
Backend: http://localhost:5000

🔌 API Endpoints
Authentication
POST /api/auth/register
POST /api/auth/login
Medicines
GET /api/medicines
POST /api/medicines
PUT /api/medicines/:id
DELETE /api/medicines/:id
Sales
GET /api/sales
POST /api/sales
Suppliers
GET /api/suppliers
POST /api/suppliers
Customers
GET /api/customers
POST /api/customers

🗄️ Database Design

Users Table
id (PK)
name
email
password
role (admin / pharmacist / staff)

Medicines Table
id (PK)
name
batch_no
expiry_date
stock_quantity
price

Sales Table
id (PK)
medicine_id (FK)
quantity
total_price
date

Suppliers Table
id (PK)
name
contact
address
Customers Table
id (PK)
name
phone
address

🔐 Authentication Flow
User logs in
Server validates credentials
JWT token is generated
Token is used for protected routes
Role-based access control is applied

🧪 Testing Guide
Use Postman for API testing
Test all CRUD operations
Validate error handling
Check database relationships
Ensure frontend-backend integration works properly

⚙️ Development Rules

Use modular structure (routes, controllers, models)
Separate frontend and backend clearly
Never commit .env file
Use meaningful commit messages
Follow REST API standards
Handle errors using middleware
Validate all inputs before database insertion

🔄 Git Workflow

git pull origin main
git checkout -b feature-name
git add .
git commit -m "feature update"
git push origin feature-name

🚀 Future Improvements

📱 Mobile application integration
🏥 Multi-branch pharmacy system
🤖 AI-based inventory forecasting
☁️ Cloud deployment (AWS / Render / Railway)
⚡ Real-time updates using WebSockets

📊 Advanced analytics dashboard

👨‍💻 Developer Notes

Frontend runs on: http://localhost:5173
Backend runs on: http://localhost:5000

Ensure MySQL is running before starting backend
Use npm run dev for development mode
Install all dependencies before running project

⭐ Author

AriaHealth Development Team

🎯 Important Notes
Always run npm install before starting project
Ensure database is created before backend start
Keep .env file private (DO NOT upload to GitHub)
Use consistent coding style across the project
🎉 End of Developer Guide

This file explains how the system is built and how developers should work with it.
