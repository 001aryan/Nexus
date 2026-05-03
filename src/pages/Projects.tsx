import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, LayoutGrid, List as ListIcon, MoreVertical, FolderKanban, Type, FileText, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({ 
    name: '', 
    description: '',
    deadline: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
  });
  const [creating, setCreating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !auth?.currentUser) return;
    setCreating(true);
    try {
      await addDoc(collection(db, 'projects'), {
        name: newProject.name,
        description: newProject.description,
        memberIds: [auth.currentUser.uid],
        ownerId: auth.currentUser.uid,
        deadline: new Date(newProject.deadline).getTime(),
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      toast.success('Project deployed');
      setIsCreating(false);
      setNewProject({ 
        name: '', 
        description: '',
        deadline: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
      });
    } catch (e) {
      toast.error('Deployment failed');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const isDemo = localStorage.getItem('nexus_mock_user');
    
    if (isDemo) {
      const user = JSON.parse(isDemo);
      setIsAdmin(user.role === 'admin');
      const localProjects = JSON.parse(localStorage.getItem('nexus_demo_projects') || '[]');
      setProjects(localProjects);
      setLoading(false);
      return;
    }

    const checkAdmin = async () => {
      if (auth.currentUser && db) {
        const { getDoc, doc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (snap.exists()) {
          setIsAdmin(snap.data().role === 'admin');
        }
      }
    };
    checkAdmin();

    if (!db || !auth?.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'projects'),
      where('memberIds', 'array-contains', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projs);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase tracking-wider">Project Portfolio</h1>
          <p className="text-[11px] text-slate-500 font-medium">Tracking {projects.length} active initiatives</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white border border-border p-0.5 rounded flex items-center shadow-sm">
            <Button 
              variant={view === 'grid' ? 'secondary' : 'ghost'} 
              size="icon" 
              onClick={() => setView('grid')}
              className="h-7 w-7 rounded-sm"
            >
              <LayoutGrid size={14} />
            </Button>
            <Button 
              variant={view === 'list' ? 'secondary' : 'ghost'} 
              size="icon" 
              onClick={() => setView('list')}
              className="h-7 w-7 rounded-sm"
            >
              <ListIcon size={14} />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white border border-border rounded animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="hd-card py-20 text-center flex flex-col items-center border-dashed">
          <h3 className="text-sm font-bold text-slate-900 uppercase">Workspace Empty</h3>
          <p className="text-[11px] text-slate-500 mt-1 mb-6">No project infrastructure detected in current region.</p>
          {isAdmin ? (
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger
                render={
                  <button className="h-9 bg-brand hover:bg-brand/90 text-white px-6 font-bold text-xs rounded-md transition-colors cursor-pointer outline-none">
                    CREATE PROJECT
                  </button>
                }
              />
              <DialogContent className="max-w-md p-0 overflow-hidden">
                <div className="bg-sidebar p-5 text-white">
                    <h3 className="font-bold text-sm uppercase">Quick Entry Terminal</h3>
                </div>
                <form onSubmit={handleCreate} className="p-6 space-y-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase">Project Name</Label>
                      <Input 
                        value={newProject.name} 
                        onChange={e => setNewProject({...newProject, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-500 uppercase">Deadline</Label>
                      <Input 
                        type="date"
                        value={newProject.deadline} 
                        onChange={e => setNewProject({...newProject, deadline: e.target.value})}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full bg-brand h-10 font-bold uppercase text-[10px]" disabled={creating}>
                      {creating ? 'DEPLOYING...' : 'INITIATE REGION'}
                    </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Awaiting Administrator Synchronization</p>
          )}
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          {view === 'grid' ? (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {projects.map((project, i) => (
                // @ts-ignore
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div layout className="hd-card overflow-hidden">
               {projects.map((project) => (
                 // @ts-ignore
                 <ProjectListItem key={project.id} project={project} />
               ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function ProjectCard({ project, index }: { project: Project, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Link to={`/projects/${project.id}`}>
        <Card className="hd-card p-4 hover:border-brand transition-colors cursor-pointer group h-full">
          <div className="flex justify-between items-start mb-2">
             <div className="w-8 h-8 bg-slate-50 text-brand border border-slate-100 rounded flex items-center justify-center font-bold text-xs uppercase">
               {project.name[0]}
             </div>
             <Badge className="hd-badge hd-status-progress">ACTIVE</Badge>
          </div>
          <h4 className="font-bold text-slate-900 text-[13px] group-hover:text-brand transition-colors truncate">
            {project.name}
          </h4>
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-snug">
            {project.description || 'Project metadata container.'}
          </p>
          
          <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
             <Calendar size={10} className="text-brand" />
             <span>Deadline: {new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
             <div className="flex -space-x-1.5">
                {project.memberIds.slice(0, 3).map((m, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border border-white bg-slate-100 flex items-center justify-center text-[7px] font-bold text-slate-600">
                    {m[0].toUpperCase()}
                  </div>
                ))}
                {project.memberIds.length > 3 && (
                   <div className="w-5 h-5 rounded-full border border-white bg-slate-100 flex items-center justify-center text-[7px] font-bold text-slate-400">
                     +{project.memberIds.length - 3}
                   </div>
                )}
             </div>
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
               {project.memberIds.length} MEMBERS
             </span>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

function ProjectListItem({ project }: { project: Project }) {
  return (
    <Link to={`/projects/${project.id}`} className="block hover:bg-slate-50 border-b border-border last:border-none transition-colors">
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-slate-100 rounded text-brand font-bold text-[10px] flex items-center justify-center">
            {project.name[0]}
          </div>
          <h4 className="font-bold text-slate-900 text-[12px]">{project.name}</h4>
          <span className="text-[11px] text-slate-400 truncate max-w-[200px]">— {project.description}</span>
        </div>
        <div className="flex items-center gap-6">
           <div className="hidden md:flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
              <Calendar size={12} />
              {new Date(project.deadline).toLocaleDateString()}
           </div>
           <Badge className="hd-badge hd-status-progress">Sprinting</Badge>
           <span className="text-[10px] font-bold text-slate-400 uppercase">{project.memberIds.length} M</span>
           <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300">
             <MoreVertical size={14} />
           </Button>
        </div>
      </div>
    </Link>
  );
}


