import 'dotenv/config';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { adminAuth, adminDb } from './firebaseAdmin.js';
import type { Project, Task, UserProfile, UserRole } from '../../src/types.js';

type AuthedRequest = Request & {
  user?: {
    uid: string;
    email?: string;
    emailVerified?: boolean;
  };
};

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: true }));
app.use(express.json());

function toNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function publicUser(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): UserProfile {
  const data = doc.data() ?? {};
  return {
    uid: doc.id,
    email: String(data.email ?? ''),
    displayName: String(data.displayName ?? ''),
    photoURL: typeof data.photoURL === 'string' ? data.photoURL : undefined,
    role: (data.role === 'admin' ? 'admin' : 'member') as UserRole,
    createdAt: toNumber(data.createdAt, Date.now()),
  };
}

function publicProject(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): Project {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    ownerId: String(data.ownerId ?? ''),
    memberIds: toStringList(data.memberIds),
    deadline: toNumber(data.deadline, Date.now()),
    createdAt: toNumber(data.createdAt, Date.now()),
  };
}

function publicTask(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): Task {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    projectId: String(data.projectId ?? ''),
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    assigneeId: String(data.assigneeId ?? ''),
    status: data.status === 'in-progress' || data.status === 'completed' || data.status === 'overdue' ? data.status : 'todo',
    priority: data.priority === 'low' || data.priority === 'high' ? data.priority : 'medium',
    dueDate: toNumber(data.dueDate, Date.now()),
    creatorId: String(data.creatorId ?? ''),
    createdAt: toNumber(data.createdAt, Date.now()),
    updatedAt: toNumber(data.updatedAt, Date.now()),
  };
}

async function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Missing Firebase ID token' });
    return;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email, emailVerified: decoded.email_verified };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid Firebase ID token' });
  }
}

async function requireUserRole(uid: string) {
  const userDoc = await adminDb.collection('users').doc(uid).get();
  return userDoc.exists ? publicUser(userDoc).role : null;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/me', authMiddleware, async (req: AuthedRequest, res) => {
  const userDoc = await adminDb.collection('users').doc(req.user!.uid).get();
  if (!userDoc.exists) {
    res.status(404).json({ error: 'User profile not found' });
    return;
  }

  res.json(publicUser(userDoc));
});

app.get('/api/projects', authMiddleware, async (req: AuthedRequest, res) => {
  const role = await requireUserRole(req.user!.uid);
  if (!role) {
    res.json([]);
    return;
  }

  const snapshot = await adminDb.collection('projects').get();
  const projects = snapshot.docs.map(publicProject).filter((project) => role === 'admin' || project.memberIds.includes(req.user!.uid));
  res.json(projects);
});

app.post('/api/projects', authMiddleware, async (req: AuthedRequest, res) => {
  const body = req.body ?? {};
  const projectRef = adminDb.collection('projects').doc();
  const project: Project = {
    id: projectRef.id,
    name: String(body.name ?? ''),
    description: String(body.description ?? ''),
    ownerId: req.user!.uid,
    memberIds: Array.isArray(body.memberIds) ? [...new Set([req.user!.uid, ...toStringList(body.memberIds)])] : [req.user!.uid],
    deadline: toNumber(body.deadline, Date.now()),
    createdAt: Date.now(),
  };

  await projectRef.set(project);
  res.status(201).json(project);
});

app.get('/api/projects/:id', authMiddleware, async (req: AuthedRequest, res) => {
  const doc = await adminDb.collection('projects').doc(req.params.id).get();
  if (!doc.exists) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const project = publicProject(doc);
  if (project.ownerId !== req.user!.uid && !project.memberIds.includes(req.user!.uid)) {
    res.status(403).json({ error: 'Not allowed to access this project' });
    return;
  }

  res.json(project);
});

app.patch('/api/projects/:id', authMiddleware, async (req: AuthedRequest, res) => {
  const docRef = adminDb.collection('projects').doc(req.params.id);
  const doc = await docRef.get();
  if (!doc.exists) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const project = publicProject(doc);
  if (project.ownerId !== req.user!.uid) {
    res.status(403).json({ error: 'Only the owner can update this project' });
    return;
  }

  const updates: Partial<Project> = {};
  if (typeof req.body.name === 'string') updates.name = req.body.name;
  if (typeof req.body.description === 'string') updates.description = req.body.description;
  if (Array.isArray(req.body.memberIds)) updates.memberIds = toStringList(req.body.memberIds);
  if (req.body.deadline !== undefined) updates.deadline = toNumber(req.body.deadline, project.deadline);

  await docRef.update(updates);
  res.json({ ...project, ...updates });
});

app.delete('/api/projects/:id', authMiddleware, async (req: AuthedRequest, res) => {
  const docRef = adminDb.collection('projects').doc(req.params.id);
  const doc = await docRef.get();
  if (!doc.exists) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const project = publicProject(doc);
  if (project.ownerId !== req.user!.uid) {
    res.status(403).json({ error: 'Only the owner can delete this project' });
    return;
  }

  await docRef.delete();
  res.status(204).send();
});

app.get('/api/projects/:projectId/tasks', authMiddleware, async (req: AuthedRequest, res) => {
  const projectDoc = await adminDb.collection('projects').doc(req.params.projectId).get();
  if (!projectDoc.exists) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const project = publicProject(projectDoc);
  if (project.ownerId !== req.user!.uid && !project.memberIds.includes(req.user!.uid)) {
    res.status(403).json({ error: 'Not allowed to access this project' });
    return;
  }

  const snapshot = await adminDb.collection('tasks').where('projectId', '==', req.params.projectId).orderBy('createdAt', 'desc').get();
  res.json(snapshot.docs.map(publicTask));
});

app.post('/api/projects/:projectId/tasks', authMiddleware, async (req: AuthedRequest, res) => {
  const projectDoc = await adminDb.collection('projects').doc(req.params.projectId).get();
  if (!projectDoc.exists) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const project = publicProject(projectDoc);
  if (project.ownerId !== req.user!.uid && !project.memberIds.includes(req.user!.uid)) {
    res.status(403).json({ error: 'Not allowed to access this project' });
    return;
  }

  const taskRef = adminDb.collection('tasks').doc();
  const task: Task = {
    id: taskRef.id,
    projectId: req.params.projectId,
    title: String(req.body.title ?? ''),
    description: String(req.body.description ?? ''),
    assigneeId: String(req.body.assigneeId ?? req.user!.uid),
    status: req.body.status === 'in-progress' || req.body.status === 'completed' || req.body.status === 'overdue' ? req.body.status : 'todo',
    priority: req.body.priority === 'low' || req.body.priority === 'high' ? req.body.priority : 'medium',
    dueDate: toNumber(req.body.dueDate, Date.now()),
    creatorId: req.user!.uid,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await taskRef.set(task);
  res.status(201).json(task);
});

app.patch('/api/tasks/:id', authMiddleware, async (req: AuthedRequest, res) => {
  const docRef = adminDb.collection('tasks').doc(req.params.id);
  const doc = await docRef.get();
  if (!doc.exists) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const task = publicTask(doc);
  const projectDoc = await adminDb.collection('projects').doc(task.projectId).get();
  if (!projectDoc.exists) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const project = publicProject(projectDoc);
  if (project.ownerId !== req.user!.uid && !project.memberIds.includes(req.user!.uid)) {
    res.status(403).json({ error: 'Not allowed to access this project' });
    return;
  }

  const updates: Partial<Task> = { updatedAt: Date.now() };
  if (typeof req.body.title === 'string') updates.title = req.body.title;
  if (typeof req.body.description === 'string') updates.description = req.body.description;
  if (typeof req.body.assigneeId === 'string') updates.assigneeId = req.body.assigneeId;
  if (req.body.status === 'todo' || req.body.status === 'in-progress' || req.body.status === 'completed' || req.body.status === 'overdue') updates.status = req.body.status;
  if (req.body.priority === 'low' || req.body.priority === 'medium' || req.body.priority === 'high') updates.priority = req.body.priority;
  if (req.body.dueDate !== undefined) updates.dueDate = toNumber(req.body.dueDate, task.dueDate);

  await docRef.update(updates);
  res.json({ ...task, ...updates });
});

app.delete('/api/tasks/:id', authMiddleware, async (req: AuthedRequest, res) => {
  const docRef = adminDb.collection('tasks').doc(req.params.id);
  const doc = await docRef.get();
  if (!doc.exists) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const task = publicTask(doc);
  if (task.creatorId !== req.user!.uid) {
    res.status(403).json({ error: 'Only the creator can delete this task' });
    return;
  }

  await docRef.delete();
  res.status(204).send();
});

app.get('/api/users', authMiddleware, async (req: AuthedRequest, res) => {
  const role = await requireUserRole(req.user!.uid);
  if (role !== 'admin') {
    res.status(403).json({ error: 'Only admins can list users' });
    return;
  }

  const snapshot = await adminDb.collection('users').get();
  res.json(snapshot.docs.map(publicUser));
});

app.post('/api/users', authMiddleware, async (req: AuthedRequest, res) => {
  const role = await requireUserRole(req.user!.uid);
  if (role !== 'admin') {
    res.status(403).json({ error: 'Only admins can create users' });
    return;
  }

  const uid = String(req.body.uid ?? '').trim();
  if (!uid) {
    res.status(400).json({ error: 'uid is required' });
    return;
  }

  const user: UserProfile = {
    uid,
    email: String(req.body.email ?? ''),
    displayName: String(req.body.displayName ?? ''),
    photoURL: typeof req.body.photoURL === 'string' ? req.body.photoURL : undefined,
    role: req.body.role === 'admin' ? 'admin' : 'member',
    createdAt: Date.now(),
  };

  await adminDb.collection('users').doc(uid).set(user);
  res.status(201).json(user);
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : 'Unknown server error';
  res.status(500).json({ error: message });
});

app.listen(port, () => {
  console.log(`Backend API running on http://localhost:${port}`);
});