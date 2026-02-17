import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Site } from '../types';
import { Link } from 'react-router-dom';
import { Globe, Clock, ArrowRight, Activity, Plus } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const q = query(
          collection(db, "sites"),
          where("ownerId", "==", user.uid),
          orderBy("updatedAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const fetchedSites: Site[] = [];
        querySnapshot.forEach((doc) => {
          fetchedSites.push({ id: doc.id, ...doc.data() } as Site);
        });
        setSites(fetchedSites);
      } catch (error) {
        console.error("Error fetching sites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, [user]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-slate-800 rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Team Overview</h1>
          <p className="text-slate-400">Manage your deployed sites and projects.</p>
        </div>
        <Link
          to="/deploy"
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add New Site
        </Link>
      </div>

      {sites.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">No sites yet</h3>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto">
            Deploy your first static site by dragging and dropping your folder.
          </p>
          <Link
            to="/deploy"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium"
          >
            Start Deployment <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <Link
              key={site.id}
              to={`/site/${site.id}`}
              className="group bg-slate-800 hover:bg-slate-800/80 border border-slate-700 hover:border-slate-600 rounded-xl overflow-hidden transition-all duration-200 flex flex-col h-full"
            >
              <div className="h-32 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                {/* Simulated Thumbnail */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-800 to-slate-900 opacity-50"></div>
                <Globe className="w-12 h-12 text-slate-700 group-hover:text-slate-600 transition-colors" />
                
                <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        site.status === 'live' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                        site.status === 'deploying' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                        {site.status}
                    </span>
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-white mb-1 group-hover:text-blue-400 transition-colors">
                  {site.name}
                </h3>
                <a 
                    href={site.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={(e) => e.stopPropagation()} 
                    className="text-sm text-slate-400 hover:underline hover:text-slate-300 truncate mb-4 block"
                >
                  {site.url || 'No URL generated'}
                </a>
                
                <div className="mt-auto flex items-center justify-between text-xs text-slate-500 border-t border-slate-700/50 pt-4">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(site.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span>{site.deploymentCount} deploys</span>
                    </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;