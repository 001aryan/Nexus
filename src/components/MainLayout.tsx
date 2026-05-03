import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { User } from 'firebase/auth';
import { 
  LayoutDashboard, 
  FolderKanban, 
  User as UserIcon, 
  LogOut, 
  Layers,
  ChevronRight,
  Plus,
  Type,
  FileText,
  Users,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/lib/firebase';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface MainLayoutProps {
  user: User | null;
}

export default function MainLayout({ user }: MainLayoutProps) {
  const location = useLocation();
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProject, setNewProject] = useState({ 
    name: '', 
    description: '',
    deadline: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      const isDemo = localStorage.getItem('nexus_mock_user');
      if (isDemo) {
        setProfile(JSON.parse(isDemo));
        return;
      }
      if (db && user) {
        const { getDoc, doc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          setProfile(snap.data());
        }
      }
    };
    fetchProfile();
  }, [user]);

  const isAdmin = profile?.role === 'admin' || user?.email === 'admin@nexus-core.io';

  const handleLogout = () => {
    localStorage.removeItem('nexus_mock_user');
    if (auth) {
      auth.signOut();
    }
    window.location.href = '/login';
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) return;

    setLoading(true);
    const projectData = {
      id: crypto.randomUUID(),
      name: newProject.name,
      description: newProject.description,
      memberIds: [user?.uid || 'demo-user'],
      ownerId: user?.uid || 'demo-user',
      deadline: new Date(newProject.deadline).getTime(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'active' as const
    };

    try {
      if (db && !localStorage.getItem('nexus_mock_user')) {
        await addDoc(collection(db, 'projects'), projectData);
      } else {
        // Mock storage for demo accounts
        const existing = JSON.parse(localStorage.getItem('nexus_demo_projects') || '[]');
        localStorage.setItem('nexus_demo_projects', JSON.stringify([...existing, projectData]));
        // Simulate network delay for demo feel
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      toast.success('Project initialized successfully');
      setIsCreatingProject(false);
      setNewProject({ 
        name: '', 
        description: '',
        deadline: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
      });
      // Refresh the page or update state to show changes
      if (!db || localStorage.getItem('nexus_mock_user')) {
        window.location.reload();
      }
    } catch (error) {
      console.error(error);
      toast.error('Initialization sequence failed');
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Team', path: '/team', icon: Users },
    { name: 'Profile', path: '/profile', icon: UserIcon },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - High Density Dark */}
      <aside className="w-56 bg-sidebar border-r border-[#1E293B] flex flex-col text-sidebar-foreground">
        <div className="h-14 px-4 flex items-center gap-3 border-b border-[#1E293B]">
          <div className="w-6 h-6 bg-brand rounded flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-500/20">
            N
          </div>
          <span className="font-bold text-sm tracking-tight text-white uppercase letter-spacing-[0.05em]">Nexus Core</span>
        </div>

        <div className="px-4 pt-6 pb-2">
          <span className="text-[10px] font-bold text-[#475569] uppercase tracking-widest">Workspace</span>
        </div>

        <nav className="flex-1 px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded transition-colors duration-200 text-[12px] font-medium",
                  isActive 
                    ? "bg-sidebar-active text-white border-l-2 border-brand" 
                    : "hover:bg-[#1E293B] hover:text-[#F1F5F9]"
                )}>
                  <Icon size={16} />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[#1E293B] p-2">
          <div className="flex items-center gap-3 px-2 py-3">
             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs ring-2 ring-slate-800">
               {user?.displayName?.[0] || 'U'}
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="text-[11px] font-bold text-white truncate leading-tight">
                 {user?.displayName || 'User'}
               </p>
               <p className="text-[10px] text-[#64748B] truncate">
                 {user?.email}
               </p>
             </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start h-8 px-2 text-[11px] text-sidebar-foreground hover:bg-rose-900/20 hover:text-rose-400"
            onClick={handleLogout}
          >
            <LogOut size={14} className="mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <header className="h-14 border-b border-border bg-white flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
             <span>Nexus</span>
             <ChevronRight size={12} />
             <span className="font-semibold text-[#1E293B] uppercase tracking-wide">
               {location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1).replace('/', ' / ')}
             </span>
          </div>
          
          <div className="flex items-center gap-3">
             <div className={cn(
               "text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider",
               isAdmin 
                 ? "bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]" 
                 : "bg-slate-100 text-slate-500 border-slate-200"
             )}>
               {isAdmin ? 'PRIME ADMIN' : 'STAFF MEMBER'}
             </div>
             <div className="h-4 w-[1px] bg-border" />
             {isAdmin && (
               <Dialog open={isCreatingProject} onOpenChange={setIsCreatingProject}>
                 <DialogTrigger
                  render={
                    <button className="h-8 bg-brand hover:bg-blue-600 text-white text-[11px] font-bold px-4 flex items-center rounded-md transition-colors cursor-pointer outline-none">
                      <Plus size={14} className="mr-1" />
                      CREATE NEW
                    </button>
                  }
                />
                 <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
                   <div className="bg-sidebar p-6 text-white overflow-hidden relative">
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-brand/20 rounded-full blur-2xl" />
                      <h2 className="text-xl font-bold uppercase tracking-tight relative z-10">Initialize Project</h2>
                      <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-1 relative z-10">Workspace Orchestration</p>
                   </div>
                   <form onSubmit={handleCreateProject} className="p-6 space-y-4 bg-white">
                     <div className="space-y-1.5">
                       <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                         <Type size={12} className="text-brand" /> Project Identifier
                       </Label>
                       <Input 
                          placeholder="e.g. Nexus Core Infrastructure" 
                          className="h-10 text-sm border-slate-100 bg-slate-50/50"
                          value={newProject.name}
                          onChange={e => setNewProject({...newProject, name: e.target.value})}
                          required
                       />
                     </div>
                     <div className="space-y-1.5">
                       <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                         <Calendar size={12} className="text-brand" /> Project Deadline
                       </Label>
                       <Input 
                          type="date"
                          className="h-10 text-sm border-slate-100 bg-slate-50/50"
                          value={newProject.deadline}
                          onChange={e => setNewProject({...newProject, deadline: e.target.value})}
                          required
                       />
                     </div>
                     <div className="space-y-1.5">
                       <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                         <FileText size={12} className="text-brand" /> Technical Description
                       </Label>
                       <textarea 
                          className="w-full min-h-[80px] rounded-md border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm outline-none focus:border-brand transition-colors"
                          placeholder="Project scope and objectives..."
                          value={newProject.description}
                          onChange={e => setNewProject({...newProject, description: e.target.value})}
                       />
                     </div>
                     <Button type="submit" className="w-full bg-brand h-11 font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20" disabled={loading}>
                       {loading ? 'INITIALIZING...' : 'START DEPLOYMENT'}
                     </Button>
                   </form>
                 </DialogContent>
               </Dialog>
             )}
          </div>
        </header>

        <div className="p-6 flex-1 overflow-y-auto">
           <div className="max-w-7xl mx-auto">
             <Outlet />
           </div>
        </div>
      </main>
    </div>
  );
}
