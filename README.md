# Nexus Core - High-Density Project Orchestrator

Nexus Core is a high-performance project management dashboard designed with a "High Density" aesthetic, emphasizing data clarity, technical precision, and rapid orchestration.

## 🚀 Key Features

- **Advanced Role-Based Access Control (RBAC)**: 
  - **Prime Admins**: Superpower access to initialize projects, onboard personnel, and deploy tasks.
  - **Staff Members**: Focused access rights to view assignments and update progress without administrative overhead.
- **Project Infrastructure**: Initialize and manage complex project regions with dedicated technical descriptions and deadlines.
- **Task Orchestration**: Unit-level task management with priority levels (Low to Critical), explicit assignees, and real-time status tracking.
- **Team Management**: Provision and manage personnel within the Nexus network.
- **Analytical Dashboard**: Real-time stats on active tasks, completion rates, and team velocity.

## 🛠 Technical Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS
- **Database/Auth**: Firebase (Firestore & Firebase Auth)
- **Animations**: Framer Motion (via `motion/react`)
- **Icons**: Lucide React
- **UI Components**: Radix UI (Shadcn UI based)

## 🔐 User Roles

### Prime Admin
- Full CRUD access to Projects.
- Full CRUD access to Tasks.
- Ability to onboard and manage Team Members.
- Access to the Global Dashboard with full stats.
- **Demo Login**: `admin@nexus-core.io`

### Staff Member
- View-only access to Project portfolios.
- View and update assigned tasks.
- Personal task tracking display in the team view.
- **Demo Login**: `staff@nexus-core.io`

## 📁 Project Structure

```text
src/
├── components/     # UI components and layout wrappers
├── lib/            # Firebase configuration and utilities
├── pages/          # Individual screen implementations
├── types/          # TypeScript definitions
└── App.tsx         # Routing and core logic
```

## ⚙️ Setup & Deployment

1. **Environment Variables**: Configure your Firebase credentials in `.env` (refer to `.env.example`).
2. **Installation**: `npm install`
3. **Development**: `npm run dev`
4. **Build**: `npm run build`

## 📋 Security Architecture

Nexus Core implements strict data validation patterns and server-side rules (Firestore Security Rules) to ensure that identity claims (UIDs) and system roles cannot be spoofed by client-side modifications.
