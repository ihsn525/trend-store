Digital Store: Full-Stack E-Commerce Application
A premium, responsive e-commerce platform built as part of a Web Programming digital assignment. This project demonstrates a complete integration between a modern React frontend and a Firebase cloud backend.

🚀 Click Here for Live Demo
🛠 Technical Architecture
This application follows a Serverless Architecture using the following stack:

Frontend: React.js with Vite for optimized bundling.

Styling: Custom CSS3 utilizing CSS Variables for a "Premium Glassmorphism" UI.

Backend-as-a-Service (BaaS): Firebase.

Database: Google Firestore (NoSQL) for real-time data synchronization.

Authentication: Firebase Auth supporting Google OAuth 2.0.

Deployment: Vercel for continuous integration and hosting.

✨ Key Features
1. Dynamic Storefront
Fetches real-time product data directly from Firestore.

Advanced filtering system by category (Tech, Shoes, Apparel).

Live search functionality with debounced input handling.

2. User Authentication & Security
Secure login via Google Authentication.

Role-Based Access Control (RBAC): The application identifies the admin user by email.

Firestore Security Rules: The database is locked down; only the authorized admin can modify products or view all orders.

3. Shopping & Checkout Workflow
Persistent shopping cart using localStorage.

Multi-step checkout process with form validation.

Unique Order ID generation and automatic stock-to-order mapping.

4. Admin Command Center
A private dashboard accessible only to: ihsansiju466@gmail.com.

Order Management: View all customer orders and update shipping status (Processing, Shipped, Delivered).

Inventory Management: Ability to add new products or remove existing ones directly from the UI.

📦 Local Setup Instructions
To run this project on your machine:

Clone the repository:

Bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
Install dependencies:

Bash
npm install
Environment Variables: Create a .env file in the root and add your Firebase configuration:

Plaintext
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
...etc
Start development server:

Bash
npm run dev
🎓 Assignment Submission Details
Course: Web Programming

Assignment: Assessment 2

Reg No: 24BCE0882

Developer: Ihsan Siju

Submission Date: February 6th 2026
