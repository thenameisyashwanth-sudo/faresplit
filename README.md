# FareSplit ✨

FareSplit is an AI-powered, modern group trip expense-splitting & financial settlement web application.

## Key Features

- **🕸️ Interactive Debt Graph Visualizer**: Graph Theory $O(N)$ Debt Minimization Topology comparing raw debt webs vs. streamlined minimum cash flows.
- **🤖 AI Smart Receipt Vision Scanner**: Upload or capture receipt photos to automatically extract merchant name, total amount, category, and date.
- **🎙️ AI Voice-to-JSON Natural Language Expense Logger**: Web Speech API integration that parses spoken phrases (*"Rahul paid 2400 for dinner"*) directly into structured form state.
- **📊 Group Budget Predictor & Daily Burn-Rate Engine**: Real-time target budget tracking, daily burn rate (`₹/day`), projected final trip expense forecast, and smart advice nudges.
- **🎡 Gamified "Who Pays Next?" Wheel Spinner**: Fun interactive 3D spinning wheel with physics-based deceleration and confetti fireworks.
- **📲 One-Tap Deep-Link Settlement & Dynamic QR Generator**: Direct `upi://pay` deep-linking into Google Pay/PhonePe/Paytm with dynamic SVG QR code generation.
- **📄 Instant PDF & CSV Report Export**: One-click formatted `.csv` downloads and printable PDF summary reports.
- **🔐 Firebase Auth & Realtime Firestore**: Google Authentication, trip invite codes, and real-time multi-user synchronization.

## Tech Stack

- **Frontend**: React 19 + Vite + TailwindCSS + Framer Motion + Three.js + Recharts
- **Database & Auth**: Firebase (Authentication, Firestore NoSQL)
- **Algorithms**: Greedy Cash-Flow Debt Minimization Algorithm

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```
