import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, updateDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Project, Task, TaskStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Settings, 
  ChevronLeft, 
  Filter, 
  Search,
  MoreHorizontal,
  Calendar,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { cn } from '@/lib/utils';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Task Creation Logic (Simplified for High Density aesthetic)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    priority: 'medium' as any,
    assigneeId: '',
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  });

  const fetchTeam = async () => {
    const isDemo = localStorage.getItem('nexus_mock_user');
    if (isDemo) {
      const user = JSON.parse(isDemo);
      setIsAdmin(user.role === 'admin');
      const defaultTeam = [
        { uid: 'demo-admin', displayName: 'System Admin' },
        { uid: 'demo-staff', displayName: 'Staff Member (Employee)' }
      ];
      const localTeam = JSON.parse(localStorage.getItem('nexus_demo_team') || '[]');
      setEmployees([...defaultTeam, ...localTeam]);
    } else if (db) {
       const q = query(collection(db, 'users'));
       const snap = await getDocs(q);
       setEmployees(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
       
       if (auth.currentUser) {
         const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
         if (userSnap.exists()) {
           setIsAdmin(userSnap.data().role === 'admin');
         }
       }
    }
  };

  useEffect(() => {
    fetchTeam();
    const isDemo = localStorage.getItem('nexus_mock_user');
    
    if (isDemo) {
      const localProjects = JSON.parse(localStorage.getItem('nexus_demo_projects') || '[]');
      const found = localProjects.find((p: any) => p.id === id);
      if (found) {
        setProject(found);
        setTasks(JSON.parse(localStorage.getItem(`nexus_demo_tasks_${id}`) || '[]'));
      }
      setLoading(false);
      // Set default assignee to self for demo
      const currentUser = JSON.parse(localStorage.getItem('nexus_mock_user') || '{}');
      setNewTask(prev => ({ ...prev, assigneeId: currentUser.uid || 'demo-admin' }));
      return;
    }

    if (!db || !id) return;
    
    // Fetch Project
    const docRef = doc(db, 'projects', id);
    const unsubProj = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setProject({ id: snap.id, ...snap.data() } as Project);
      } else {
        toast.error('Project not found');
        navigate('/projects');
      }
    });

    // Listen to Tasks
    const q = query(collection(db, 'tasks'), where('projectId', '==', id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
      setLoading(false);
    });

    return () => {
      unsubProj();
      unsubscribe();
    };
  }, [id, navigate]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser || !id) return;

    const taskData = {
      projectId: id,
      title: newTask.title,
      description: newTask.description,
      status: 'todo' as TaskStatus,
      priority: newTask.priority,
      dueDate: new Date(newTask.dueDate).getTime(),
      creatorId: auth.currentUser.uid,
      assigneeId: newTask.assigneeId || auth.currentUser.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      if (db && !localStorage.getItem('nexus_mock_user')) {
        await addDoc(collection(db, 'tasks'), taskData);
      } else {
        const localTasks = JSON.parse(localStorage.getItem(`nexus_demo_tasks_${id}`) || '[]');
        const taskWithId = { ...taskData, id: crypto.randomUUID() };
        const updated = [...localTasks, taskWithId];
        localStorage.setItem(`nexus_demo_tasks_${id}`, JSON.stringify(updated));
        setTasks(updated);
        await new Promise(r => setTimeout(r, 400));
      }
      setIsTaskModalOpen(false);
      setNewTask({ 
        title: '', 
        description: '', 
        priority: 'medium', 
        assigneeId: auth.currentUser.uid,
        dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
      });
      toast.success('Task created and assigned!');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const columns = [
    { title: 'TO DO', status: 'todo' },
    { title: 'IN PROGRESS', status: 'in-progress' },
    { title: 'DONE', status: 'completed' },
  ];

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Link to="/projects" className="text-slate-400 hover:text-brand transition-colors">
               <ChevronLeft size={16} />
             </Link>
             <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 uppercase">
               {project?.name || 'INITIALIZING...'}
               <Badge className="hd-badge hd-status-progress h-5">LIVE</Badge>
             </h1>
          </div>
          <p className="text-[11px] text-slate-500 font-medium ml-6 flex items-center gap-2">
            Manager: <span className="text-slate-700"> Sarah Chen</span> • 
            Status: <span className="text-slate-700 uppercase tracking-tighter">TRACKING</span> • 
            Deadline: <span className="text-brand font-bold uppercase">{project ? new Date(project.deadline).toLocaleDateString() : 'N/A'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <Input 
              placeholder="Search components..." 
              className="h-8 pl-8 text-[11px] w-48 bg-white border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {isAdmin && (
            <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
              <DialogTrigger
                render={
                  <button className="h-8 bg-brand hover:bg-brand/90 text-white transition-colors px-3 text-[11px] font-bold flex items-center rounded-md cursor-pointer outline-none">
                    <Plus size={14} className="mr-1.5" />
                    NEW TASK
                  </button>
                }
              />
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Component to {project?.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTask} className="py-4 space-y-4">
                   <div className="space-y-2">
                     <Label className="text-[11px] font-bold text-slate-500">TITLE</Label>
                     <Input 
                       className="h-9 text-sm"
                       value={newTask.title}
                       onChange={e => setNewTask({...newTask, title: e.target.value})}
                       required 
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label className="text-[11px] font-bold text-slate-500">PRIORITY</Label>
                       <select 
                         className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand"
                         value={newTask.priority}
                         onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                       >
                         <option value="low">LOW</option>
                         <option value="medium">MEDIUM</option>
                         <option value="high">HIGH</option>
                         <option value="critical">CRITICAL</option>
                       </select>
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[11px] font-bold text-slate-500">ASSIGNEE</Label>
                       <select 
                         className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand"
                         value={newTask.assigneeId}
                         onChange={e => setNewTask({...newTask, assigneeId: e.target.value})}
                       >
                          {employees.map(emp => (
                            <option key={emp.uid} value={emp.uid}>
                              {emp.displayName.toUpperCase()}
                            </option>
                          ))}
                       </select>
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[11px] font-bold text-slate-500">DEADLINE (DUE DATE)</Label>
                     <Input 
                       type="date"
                       className="h-9 text-sm"
                       value={newTask.dueDate}
                       onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                       required 
                     />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[11px] font-bold text-slate-500">DESCRIPTION</Label>
                     <textarea 
                       className="w-full min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                       value={newTask.description}
                       onChange={e => setNewTask({...newTask, description: e.target.value})}
                     />
                   </div>
                   <Button type="submit" className="w-full bg-brand h-10 font-bold">DEPLOY TASK</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map(col => (
            <div key={col.status} className="w-72 flex flex-col h-full bg-slate-50/50 border border-transparent rounded-lg">
              <div className="p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", 
                    col.status === 'completed' ? 'bg-green-500' : 
                    col.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-300'
                  )} />
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">{col.title}</h3>
                  <span className="text-[10px] font-bold text-slate-300 bg-white border border-slate-100 rounded px-1.5 min-w-[20px] text-center">
                    {filteredTasks.filter(t => t.status === col.status).length}
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-slate-600">
                  <MoreHorizontal size={14} />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 custom-scrollbar">
                {filteredTasks
                  .filter(t => t.status === col.status)
                  .map(task => (
                    // @ts-ignore
                    <TaskCard key={task.id} task={task} />
                  ))
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const updateStatus = async (status: TaskStatus) => {
    const isDemo = localStorage.getItem('nexus_mock_user');
    try {
      if (db && !isDemo) {
        await updateDoc(doc(db, 'tasks', task.id), { status, updatedAt: Date.now() });
      } else {
        const localTasks = JSON.parse(localStorage.getItem(`nexus_demo_tasks_${task.projectId}`) || '[]');
        const updated = localTasks.map((t: any) => t.id === task.id ? { ...t, status, updatedAt: Date.now() } : t);
        localStorage.setItem(`nexus_demo_tasks_${task.projectId}`, JSON.stringify(updated));
        // Force the parent to reload tasks by reaching into storage is tricky, so we'll just reload or use a better state management.
        // For now, reload window is the simplest way for demo consistency.
        window.location.reload();
      }
      toast.success(`Task status updated`);
    } catch (e) {
      toast.error('Update failed');
    }
  };

  const priorityColors = {
    high: 'text-rose-500 bg-rose-50 border-rose-100',
    medium: 'text-amber-500 bg-amber-50 border-amber-100',
    low: 'text-slate-500 bg-slate-50 border-slate-100',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -1 }}
    >
      <Card className="hd-card p-3 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start">
             <Badge className={cn("text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-tighter border", priorityColors[task.priority] || priorityColors.medium)}>
               {task.priority || 'medium'}
             </Badge>
             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button onClick={() => updateStatus('todo')} variant="ghost" size="icon" className="h-5 w-5 p-0">
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                </Button>
                <Button onClick={() => updateStatus('in-progress')} variant="ghost" size="icon" className="h-5 w-5 p-0">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                </Button>
                <Button onClick={() => updateStatus('completed')} variant="ghost" size="icon" className="h-5 w-5 p-0">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                </Button>
             </div>
          </div>
          <h5 className="text-[12px] font-bold text-slate-900 group-hover:text-brand transition-colors leading-snug">
            {task.title}
          </h5>
          <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
            {task.description}
          </p>
          
          <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-50">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
               <Clock size={10} />
               <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase()}</span>
            </div>
            <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-bold text-white border border-white">
              {task.assigneeId?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}


