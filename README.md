# 🏥 MedFlow HMS

[![Backend](https://img.shields.io/badge/Backend-Bun%20%2B%20Express-green)](https://bun.sh/)  
[![Frontend](https://img.shields.io/badge/Frontend-React%20Router%20v7-blue)](https://react.dev/)  
[![Database](https://img.shields.io/badge/Database-MongoDB-green)](https://www.mongodb.com/)  
[![Realtime](https://img.shields.io/badge/Realtime-Socket.io-black)](https://socket.io/)  
[![License](https://img.shields.io/badge/License-ISC-yellow)](LICENSE)

A **modern Hospital Management System** built with **Bun + Express (backend)** and **React Router v7 + Vite (frontend)** ⚡🏥  

_Built with ❤️ by [Shehab Ahmed]_

---

## ✨ Features Overview

### 🔐 Authentication & Roles
- 🔑 Secure authentication using **Better Auth**  
- 👥 Role-based access control (RBAC)  
- 🧑‍⚕️ Roles:
  - Admin  
  - Doctor  
  - Nurse  
  - Lab Technician  
  - Patient  

---

### 👨‍⚕️ Patient Management
- ➕ Admit patients into the system  
- 🤖 AI-powered doctor & nurse assignment  
- 📄 Track patient status & medical history  

---

### 🧠 AI Features
- 🩻 X-ray analysis using **Google Gemini AI**  
- 🤖 Smart triage system for staff assignment  
- 📊 Clinical summaries & findings  

---

### 🧪 Lab Results
- 📤 Upload lab results (X-rays, tests)  
- 📄 Fetch patient lab history  
- ✏️ Update results with doctor notes  

---

### 💰 Billing System
- 🧾 Create and manage invoices  
- ➕ Add medical charges dynamically  
- 📊 View billing history  
- ✅ Mark invoices as paid  

---

### 🔔 Notifications
- 📡 Real-time notifications via **Socket.io**  
- 📬 Stored in database  
- 🔴 Unread notifications counter  

---

### 📊 Activity Logs
- 📝 Track system activities  
- 🔒 Accessible by admins & doctors only  

---

## 🛠️ Tech Stack

### Backend
- Bun + Express 5  
- MongoDB + Mongoose  
- Better Auth (Authentication)  
- Inngest (Background jobs)  
- Socket.io (Realtime)  
- Google Gemini AI  

---

### Frontend
- React 19  
- React Router v7  
- React Query  
- Axios  
- TailwindCSS + ShadCN UI  

---

### Realtime
- Socket.io → live notifications  

---

## 💡 Notes
- Authentication handled via **Better Auth middleware**  
- Role-based access enforced using custom `checkRole` middleware  
- AI workflows handled asynchronously via **Inngest**  
- Notifications stored in DB + emitted via Socket.io  
- Clean modular architecture (routes → controllers → services)  

---

## ⚡ Background Jobs

### 🧑‍⚕️ Patient Admission
- Assign doctor & nurse using AI  
- Update patient record  
- Send notifications  

### 🩻 X-ray Analysis
- Analyze medical images using Gemini  
- Store AI results  
- Notify assigned staff  

### 💳 Billing Automation
- Add charges to invoice  
- Auto-update totals  

---

## 📡 API Modules

- 👤 Users  
- 🧾 Billing / Invoices  
- 🧪 Lab Results  
- 🔔 Notifications  
- 📊 Activity Logs  
- 📤 Uploads  

---

## 🎨 Badges

[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)  
[![Bun](https://img.shields.io/badge/Bun-latest-black)](https://bun.sh/)  
[![Express](https://img.shields.io/badge/Express-5-lightgrey)](https://expressjs.com/)  
[![MongoDB](https://img.shields.io/badge/MongoDB-7-green)](https://www.mongodb.com/)  
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.3-black)](https://socket.io/)  


## 🛠 Future Improvements
- 💳 Payment integration (Stripe / Polar)  
- 📱 Mobile app (React Native)  
- 📊 Advanced analytics dashboard  
- 🧑‍⚕️ Doctor scheduling system  

---

## 👨‍💻 Author

**Shehab Ahmed**

