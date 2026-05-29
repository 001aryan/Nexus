# Nexus Core

> High-Density Project Orchestrator for technical teams, project managers, and enterprise operations.

Nexus Core is a high-performance project management platform designed around a **High Density UI philosophy**, prioritizing information visibility, operational efficiency, and rapid task orchestration. It provides advanced project tracking, role-based access control, team management, and real-time analytics through a modern React and Firebase architecture.

---

## 🚀 Features

### Advanced Role-Based Access Control (RBAC)

Nexus Core provides strict access controls to ensure users only interact with resources relevant to their responsibilities.

#### Prime Admin

* Full CRUD access to Projects
* Full CRUD access to Tasks
* Manage Team Members
* Access system-wide analytics
* Configure project infrastructure
* Assign and reassign work units

**Demo Account**

```text
Email: admin@nexus-core.io
```

#### Staff Member

* View assigned projects
* View assigned tasks
* Update task status and progress
* Track personal workload and completion metrics

**Demo Account**

```text
Email: staff@nexus-core.io
```

---

## 📊 Core Modules

### Project Infrastructure

Create and manage project regions with:

* Project title
* Technical description
* Deadlines
* Status tracking
* Team allocation

### Task Orchestration

Manage work units with:

* Priority Levels

  * Low
  * Medium
  * High
  * Critical
* Assignee management
* Progress tracking
* Status lifecycle monitoring

### Team Management

Provision and manage personnel across the Nexus network.

Capabilities include:

* User onboarding
* Role assignment
* Team visibility
* Workload distribution

### Analytics Dashboard

Real-time insights including:

* Active tasks
* Completed tasks
* Project progress
* Team velocity
* Completion rates

---

## 🛠 Technology Stack

### Frontend

* React 18
* Vite
* TypeScript

### Styling

* Tailwind CSS

### UI Components

* Radix UI
* Shadcn UI

### Animations

* Framer Motion (`motion/react`)

### Icons

* Lucide React

### Backend & Authentication

* Firebase Authentication
* Firestore Database
* Firebase Admin SDK

### API Server

* Express.js
* TypeScript

---

## 📁 Project Structure

```text
src/
├── components/     # Reusable UI components
├── lib/            # Firebase configuration and utilities
├── pages/          # Application screens/pages
├── types/          # TypeScript interfaces and types
└── App.tsx         # Routing and application bootstrap

backend/
└── src/
    └── server.ts   # Express API server
```

---

## ⚙️ Getting Started

### Prerequisites

* Node.js 18+
* npm or yarn
* Firebase Project

---

### 1. Clone Repository

```bash
git clone <repository-url>
cd nexus-core
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Configure Environment Variables

Create a `.env` file using the provided example:

```bash
cp .env.example .env
```

Add your Firebase configuration values.

Example:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

### 4. Start Development Server

```bash
npm run dev
```

Application will be available at:

```text
http://localhost:5173
```

---

### 5. Build for Production

```bash
npm run build
```

---

## 🧩 Backend API

Nexus Core includes an Express backend powered by Firebase Admin SDK.

### Start Backend

```bash
npm run dev:backend
```

---

### Authentication Setup

Provide one of the following credential options:

#### Option 1: Service Account JSON

```env
FIREBASE_SERVICE_ACCOUNT_JSON={...}
```

#### Option 2: Application Default Credentials

```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

---

## 📡 API Endpoints

### Users

```http
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

### Projects

```http
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
```

### Tasks

```http
GET    /api/projects/:id/tasks
POST   /api/projects/:id/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

---

## 🔐 Security Architecture

Security is enforced through:

### Firestore Security Rules

* Role-based authorization
* Ownership validation
* Resource-level access restrictions

### Server-Side Validation

* Input sanitization
* Role verification
* UID validation
* Request integrity checks

### Authentication

* Firebase Authentication
* Verified identity claims
* Protected API endpoints

Nexus Core is designed to prevent privilege escalation and ensure that user roles cannot be spoofed through client-side manipulation.

---

## 📈 Design Philosophy

Nexus Core follows a **High Density Interface Model**:

* Maximum information visibility
* Reduced navigation overhead
* Fast operational workflows
* Technical precision
* Enterprise-grade usability

The platform is optimized for teams that manage multiple projects, complex task structures, and high-volume operational workloads.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/new-feature
```

3. Commit changes

```bash
git commit -m "Add new feature"
```

4. Push branch

```bash
git push origin feature/new-feature
```

5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**High-Density Project Orchestration Platform**

Built with React, TypeScript, Firebase, Express, and Tailwind CSS to streamline project execution and team coordination at scale.
