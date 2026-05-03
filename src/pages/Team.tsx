import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  MoreVertical, 
  Trash2, 
  CheckCircle2,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { Task } from '@/types';

interface Employee {
  uid: string;
  displayName: string;
  email: string;
  role: 'admin' | 'staff' | 'viewer';
  status: 'active' | 'inactive';
  joinedAt: number;
}

export default function Team() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: 'staff' as 'admin' | 'staff' | 'viewer'
  });

  const fetchEmployees = async () => {
    setLoading(true);
    const isDemo = localStorage.getItem('nexus_mock_user');
    
    if (isDemo) {
      const user = JSON.parse(isDemo);
      setIsAdmin(user.role === 'admin');
      const defaultTeam: Employee[] = [
        { uid: 'demo-admin', displayName: 'System Admin', email: 'admin@nexus-core.io', role: 'admin', status: 'active', joinedAt: Date.now() - 86400000 * 30 },
        { uid: 'demo-staff', displayName: 'Staff Member', email: 'staff@nexus-core.io', role: 'staff', status: 'active', joinedAt: Date.now() - 86400000 * 15 }
      ];
      const localTeam = JSON.parse(localStorage.getItem('nexus_demo_team') || '[]');
      setEmployees([...defaultTeam, ...localTeam]);

      // Demo tasks
      const localTasks = JSON.parse(localStorage.getItem('nexus_demo_tasks') || '[]');
      setTasks(localTasks);
    } else if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const users = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as Employee));
        setEmployees(users);

        const tasksSnapshot = await getDocs(collection(db, 'tasks'));
        const allTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(allTasks);

        if (auth.currentUser) {
          const { getDoc, doc } = await import('firebase/firestore');
          const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userSnap.exists()) {
            setIsAdmin(userSnap.data().role === 'admin');
          }
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to load team data');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const isDemo = localStorage.getItem('nexus_mock_user');
    
    const employeeData: Employee = {
      uid: crypto.randomUUID(),
      displayName: newEmployee.name,
      email: newEmployee.email,
      role: newEmployee.role,
      status: 'active',
      joinedAt: Date.now()
    };

    try {
      if (isDemo) {
        const existing = JSON.parse(localStorage.getItem('nexus_demo_team') || '[]');
        localStorage.setItem('nexus_demo_team', JSON.stringify([...existing, employeeData]));
        await new Promise(r => setTimeout(r, 600));
      } else if (db) {
        await addDoc(collection(db, 'users'), employeeData);
      }
      
      toast.success('Employee added to Nexus Network');
      setIsAddModalOpen(false);
      setNewEmployee({ name: '', email: '', role: 'staff' });
      fetchEmployees();
    } catch (error) {
      toast.error('Onboarding sequence failed');
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 uppercase">
            <Users size={24} className="text-brand" /> Team Infrastructure
          </h1>
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-widest mt-1">Manage personnel and access privileges</p>
        </div>
        
        {isAdmin && (
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger
              render={
                <button className="h-10 bg-brand hover:bg-blue-600 text-white px-5 rounded-md font-bold text-[11px] uppercase tracking-widest flex items-center shadow-lg shadow-blue-500/20 transition-all cursor-pointer outline-none">
                  <UserPlus size={16} className="mr-2" />
                  Onboard Personnel
                </button>
              }
            />
            <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
              <div className="bg-sidebar p-6 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-brand/20 rounded-full blur-2xl" />
                <h2 className="text-xl font-bold uppercase tracking-tight relative z-10">Add Team Member</h2>
                <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-1 relative z-10">Network Authentication Profile</p>
              </div>
              <form onSubmit={handleAddEmployee} className="p-6 space-y-4 bg-white">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">FULL NAME</Label>
                  <Input 
                    placeholder="e.g. John Doe" 
                    className="h-10 text-sm border-slate-100 bg-slate-50/50"
                    value={newEmployee.name}
                    onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">EMAIL ADDRESS</Label>
                  <Input 
                    type="email"
                    placeholder="john@nexus-core.io" 
                    className="h-10 text-sm border-slate-100 bg-slate-50/50"
                    value={newEmployee.email}
                    onChange={e => setNewEmployee({...newEmployee, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SYSTEM ROLE</Label>
                  <select 
                     className="w-full h-10 rounded-md border border-slate-100 bg-slate-50/50 px-3 text-sm outline-none focus:border-brand"
                     value={newEmployee.role}
                     onChange={e => setNewEmployee({...newEmployee, role: e.target.value as any})}
                  >
                    <option value="staff">Staff Member</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <Button type="submit" className="w-full bg-brand h-11 font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20">
                  PROVISION ACCESS
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Control Bar */}
      <div className="flex items-center gap-3 bg-white p-2 border border-slate-100 rounded-lg shadow-sm">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
             placeholder="Filter personnel by name or email..." 
             className="pl-9 h-9 border-none bg-transparent text-[12px] shadow-none focus-visible:ring-0"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="h-4 w-[1px] bg-slate-100" />
        <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-slate-500 uppercase">
          <Filter size={14} className="mr-1.5" /> Filter
        </Button>
      </div>

      {/* Personnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-32 bg-slate-50 rounded-lg border border-slate-100 animate-pulse" />
          ))
        ) : filteredEmployees.length > 0 ? (
          filteredEmployees.map((emp, index) => (
            <motion.div
              key={emp.uid}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-white border border-slate-100 rounded-lg p-4 hover:border-brand/40 hover:shadow-md transition-all relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-sm">
                    {emp.displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-slate-900 group-hover:text-brand transition-colors">{emp.displayName}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                      <Mail size={10} />
                      {emp.email}
                    </div>
                  </div>
                </div>
                <button className="text-slate-300 hover:text-slate-600">
                  <MoreVertical size={16} />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layout size={10} /> Active Assignments
                  </span>
                  <span className="text-[10px] font-bold text-brand">
                    {tasks.filter(t => t.assigneeId === emp.uid).length} TASKS
                  </span>
                </div>
                
                <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                  {tasks.filter(t => t.assigneeId === emp.uid).slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center justify-between bg-slate-50/50 p-1.5 rounded border border-slate-100">
                      <div className="flex items-center gap-2 min-w-0">
                        {task.status === 'completed' ? (
                          <CheckCircle className="text-emerald-500 flex-shrink-0" size={10} />
                        ) : task.status === 'in-progress' ? (
                          <Clock className="text-amber-500 flex-shrink-0" size={10} />
                        ) : (
                          <AlertCircle className="text-slate-400 flex-shrink-0" size={10} />
                        )}
                        <span className="text-[10px] font-medium text-slate-600 truncate">{task.title}</span>
                      </div>
                      <span className={cn(
                        "text-[8px] font-bold px-1 rounded uppercase",
                        task.priority === 'high' ? "text-rose-500 bg-rose-50" :
                        task.priority === 'medium' ? "text-amber-500 bg-amber-50" :
                        "text-slate-500 bg-slate-50"
                      )}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                  {tasks.filter(t => t.assigneeId === emp.uid).length > 3 && (
                    <div className="text-[9px] text-center text-slate-400 font-medium py-0.5 italic">
                      + {tasks.filter(t => t.assigneeId === emp.uid).length - 3} more assignments
                    </div>
                  )}
                  {tasks.filter(t => t.assigneeId === emp.uid).length === 0 && (
                    <div className="text-[9px] text-center text-slate-300 font-medium py-2 uppercase tracking-tight">
                      No active assignments detected
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider",
                    emp.role === 'admin' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                    emp.role === 'staff' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                    "bg-slate-50 text-slate-600 border-slate-100"
                  )}>
                    {emp.role}
                  </span>
                  <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                    <Shield size={8} /> ACCESS ENABLED
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-medium text-slate-400 capitalize">
                  Joined {new Date(emp.joinedAt).toLocaleDateString()}
                </div>
              </div>
              
              {/* Status bar */}
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <Users size={32} className="text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-900 uppercase">Personnel Database Empty</h3>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">No matching personnel records found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
