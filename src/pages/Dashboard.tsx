import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Target,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, query, limit, orderBy, getDoc, doc } from 'firebase/firestore';
import { Task } from '@/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: 'Active Tasks', value: '0', icon: Target, color: 'text-brand', bg: 'bg-blue-50' },
    { label: 'Completed', value: '0', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Overdue', value: '0', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Team Velocity', value: '0%', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      const isDemo = localStorage.getItem('nexus_mock_user');
      let allTasks: any[] = [];
      let userRole = 'staff';

      if (isDemo) {
        const user = JSON.parse(isDemo);
        userRole = user.role;
        setIsAdmin(userRole === 'admin');
        
        // Mock data consolidation
        const localProjects = JSON.parse(localStorage.getItem('nexus_demo_projects') || '[]');
        localProjects.forEach((p: any) => {
          const projectTasks = JSON.parse(localStorage.getItem(`nexus_demo_tasks_${p.id}`) || '[]');
          allTasks = [...allTasks, ...projectTasks];
        });
        
        // Add default tasks if empty
        if (allTasks.length === 0) {
          allTasks = [
            { id: '1', title: 'API Rate Limiter Implementation', assigneeId: 'Marcus K.', status: 'in-progress', dueDate: Date.now() + 86400000, priority: 'high' },
            { id: '2', title: 'Database Schema Migration (v2.4)', assigneeId: 'Linda J.', status: 'completed', dueDate: Date.now() - 86400000, priority: 'medium' },
            { id: '3', title: 'Frontend Authentication Flow', assigneeId: 'Tom A.', status: 'todo', dueDate: Date.now() - 86400000 * 2, priority: 'high' },
          ];
        }
      } else if (db) {
        try {
          const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'), limit(10));
          const snap = await getDocs(q);
          allTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));

          if (auth.currentUser) {
            const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
            if (userSnap.exists()) {
              setIsAdmin(userSnap.data().role === 'admin');
            }
          }
        } catch (e) {
          console.error(e);
        }
      }

      setRecentTasks(allTasks.slice(0, 5));
      
      const active = allTasks.filter(t => t.status !== 'completed').length;
      const completed = allTasks.filter(t => t.status === 'completed').length;
      const overdue = allTasks.filter(t => t.status !== 'completed' && t.dueDate < Date.now()).length;
      const velocity = allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0;

      setStats([
        { label: 'Active Tasks', value: active.toString(), icon: Target, color: 'text-brand', bg: 'bg-blue-50' },
        { label: 'Completed', value: completed.toString(), icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Overdue', value: overdue.toString(), icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Team Velocity', value: `${velocity}%`, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      ]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const getStatusBadge = (status: string, dueDate: number) => {
    if (status === 'completed') return <Badge className="hd-badge hd-status-done">DONE</Badge>;
    if (dueDate < Date.now()) return <Badge className="hd-badge hd-status-overdue">OVERDUE</Badge>;
    if (status === 'in-progress') return <Badge className="hd-badge hd-status-progress">ACTIVE</Badge>;
    return <Badge className="hd-badge border-slate-200 text-slate-500">PENDING</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="hd-card p-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <h3 className={cn("text-2xl font-bold mt-1", stat.label === 'Overdue' && stat.value !== '0' ? 'text-rose-600' : 'text-slate-900')}>
                {stat.value}
              </h3>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks Table */}
        <Card className="lg:col-span-2 hd-card">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-border">
            <CardTitle className="text-sm font-bold text-slate-900">Recent Project Tasks</CardTitle>
            {isAdmin && (
              <Button 
                className="h-7 bg-brand hover:bg-blue-600 text-[10px] font-bold px-3"
                onClick={() => {
                  toast.info("Select a project from the Portfolio to assign new tasks.");
                  navigate('/projects');
                }}
              >
                 + CREATE TASK
              </Button>
            )}
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-border">
                  <th className="text-left py-2 px-4 font-semibold text-slate-500">TASK NAME</th>
                  <th className="text-left py-2 px-4 font-semibold text-slate-500">ASSIGNEE</th>
                  <th className="text-left py-2 px-4 font-semibold text-slate-500">STATUS</th>
                  <th className="text-left py-2 px-4 font-semibold text-slate-500">DUE DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-slate-900">{task.title}</td>
                    <td className="py-2.5 px-4 text-[10px] uppercase font-bold text-slate-400">
                       {task.assigneeId || 'UNASSIGNED'}
                    </td>
                    <td className="py-2.5 px-4">
                      {getStatusBadge(task.status, task.dueDate)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {!loading && recentTasks.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                      No recent task activity detected
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Side Panel: Team Activity & Health */}
        <div className="space-y-6">
          <Card className="hd-card bg-white p-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Team Activity</h3>
            <div className="space-y-4">
              {[
                { user: 'Linda', icon: 'LJ', action: 'uploaded schema_v2.sql', time: '2 hours ago' },
                { user: 'Marcus', icon: 'MK', action: 'moved API Auth to Done', time: '4 hours ago' }
              ].map((activity, i) => (
                <div key={i} className="flex gap-3 text-[11px]">
                  <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold">
                    {activity.icon}
                  </div>
                  <div>
                    <p className="text-slate-800 line-height-tight">
                      <span className="font-bold">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="hd-card bg-[#1E293B] text-white p-4">
             <div className="flex justify-between items-start mb-1">
               <h3 className="text-[11px] font-bold text-slate-100 uppercase tracking-wider">System Health</h3>
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             </div>
             <p className="text-[10px] text-slate-400">Railway Deployment Live</p>
             
             <div className="mt-4 space-y-3">
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: '85%' }}
                     className="h-full bg-green-500" 
                   />
                </div>
                <div className="flex justify-between text-[9px] font-medium text-slate-400">
                   <span>Nodes: 4 Active</span>
                   <span>Load: 24%</span>
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


