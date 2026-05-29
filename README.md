# 💊 AriaHealth Pharmacy Management System

## 📌 Overview
AriaHealth Pharmacy Management System is a modern web-based application designed to simplify and automate pharmacy operations. It provides a centralized platform for managing medicines, sales, prescriptions, inventory, suppliers, customers, billing, and reports.

The system helps pharmacies improve efficiency, reduce manual errors, and enhance healthcare service delivery through secure and reliable digital management.

---

## ✨ Features

- 📦 Medicine Inventory Management  
- 💰 Sales and Billing System  
- 🧾 Prescription Management  
- 🚚 Supplier and Customer Management  
- ⚠️ Expiry Date & Low-Stock Alerts  
- 📊 Financial and Sales Reporting  
- 🔐 Secure Authentication & Role-Based Access  
- 📱 Responsive and User-Friendly Dashboard  
- ⚡ Real-Time Data Management  

---

## 🛠️ Technologies Used

### Frontend
- React.js  
- Vite  
- Tailwind CSS  

### Backend
- Node.js  
- Express.js  

### Database
- MySQL  

---

## 🎯 Project Goals

- Digitize pharmacy operations  
- Improve inventory accuracy  
- Reduce paperwork and manual tasks  
- Enhance reporting and business insights  
- Provide secure and scalable pharmacy management  

---

## 📁 Project Structure
AriaHealthPharmacy/
│
├── client/ # Frontend (React + Vite)
├── server/ # Backend (Node.js + Express)
├── database/ # SQL files ([text](schema.sql))
└── README.md


---

## 🚀 Installation & Setup Guide

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/abtesfa/Ariapharmacymgmt.git

2️⃣ Open Project in VS Code

cd Ariapharmacymgmt
code .

3️⃣ Install Dependencies
📌 Frontend Setup
cd client
npm install

📌 Backend Setup
cd server
npm install


4️⃣ Setup Environment Variables

Create a .env file inside the server folder:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pharmacy_db
PORT=5000

5️⃣ Run the Application
▶️ Start Backend
cd server
npm start

▶️ Start Frontend
cd client
npm run dev

🌐 Access Application
Frontend: http://localhost:5173
Backend: http://localhost:5000

🗄️ Database Setup (MySQL)
Open MySQL / phpMyAdmin
Create database:
CREATE DATABASE pharmacy_db;
Import your .sql file (if available) into the database

🚀 Future Improvements

📱 Mobile application integration
🏥 Multi-branch pharmacy support
🤖 AI-based inventory forecasting
☁️ Cloud deployment support
📊 Advanced analytics dashboard

🔐 Security Features

Role-based authentication (Admin / Pharmacist / Staff)
Secure API handling
Protected routes
Password encryption (recommended: bcrypt)

👨‍💻 Author

Developed by AriaHealth Team

⭐ Notes
Ensure Node.js (LTS version) is installed
Ensure MySQL server is running before starting backend
Always run npm install before starting project
Keep .env file private (do NOT upload to GitHub)

🎉 Thank You

This system is built to improve pharmacy operations and healthcare efficiency through digital transformation.