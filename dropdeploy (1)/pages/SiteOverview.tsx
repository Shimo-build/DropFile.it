import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Site, Deployment } from '../types';
import { ExternalLink, Github, Clock, CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';

const SiteOverview: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!siteId) return;
      try {
        const siteDoc = await getDoc(doc(db, "sites", siteId));
        if (siteDoc.exists()) {
          setSite({ id: siteDoc.id, ...siteDoc.data() } as Site);
        }

        const deployQuery = query(
          collection(db, `sites/${siteId}/deployments`),
          orderBy("createdAt", "desc")
        );
        const deploySnap = await getDocs(deployQuery);
        const deploys: Deployment[] = [];
        deploySnap.forEach(d => deploys.push({ id: d.id, ...d.data() } as Deployment));
        setDeployments(deploys);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [siteId]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );

  if (!site) return <div className="text-white">Site not found.</div>;

  return (
    <div>
        <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white mb-6 text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Header / Info */}
            <div className="lg:col-span-2">
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">{site.name}</h1>
                        <a 
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer" 
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-2 text-lg"
                        >
                            {site.url || 'No URL'} <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                    <span className={`px-4 py-2 rounded-full font-bold uppercase tracking-wider text-sm ${
                        site.status === 'live' ? 'bg-green-500 text-slate-900' : 'bg-yellow-500 text-slate-900'
                    }`}>
                        {site.status}
                    </span>
                </div>

                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden mb-8">
                    <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                        <h2 className="font-bold text-xl text-white">Production Deployment</h2>
                    </div>
                    <div className="p-6">
                       {deployments.length > 0 ? (
                           <div className="flex items-start gap-4">
                               <div className="w-24 h-24 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                   {/* Screenshot Placeholder */}
                                   <span className="text-2xl">📸</span>
                               </div>
                               <div>
                                   <div className="flex items-center gap-2 mb-1">
                                       <h3 className="text-white font-medium">Deployment #{deployments.length}</h3>
                                       <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Published</span>
                                   </div>
                                   <p className="text-slate-400 text-sm mb-4">
                                       Deployed by {deployments[0].authorName} • {new Date(deployments[0].createdAt).toLocaleString()}
                                   </p>
                                   <div className="flex gap-3">
                                        <a 
                                            href={site.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-white text-slate-900 rounded-md font-medium text-sm hover:bg-slate-200 transition-colors"
                                        >
                                            Open Production
                                        </a>
                                   </div>
                               </div>
                           </div>
                       ) : (
                           <p className="text-slate-400">No deployments yet.</p>
                       )}
                    </div>
                </div>

                <h2 className="font-bold text-xl text-white mb-4">Deployment History</h2>
                <div className="space-y-4">
                    {deployments.map((deploy, idx) => (
                        <div key={deploy.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex items-center justify-between hover:bg-slate-800 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-2 rounded-full ${deploy.status === 'ready' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <div>
                                    <p className="text-white font-medium text-sm">
                                        Production: {new Date(deploy.createdAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-slate-500 text-xs">
                                        {deploy.fileCount} files • {(deploy.size / 1024).toFixed(1)} KB • by {deploy.authorName}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-slate-500 text-xs font-mono">{deploy.id.substring(0, 7)}</span>
                                <div className="px-3 py-1 bg-slate-700 rounded text-xs text-slate-300">
                                    {Math.floor((Date.now() - deploy.createdAt) / (1000 * 60))}m ago
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sidebar Settings */}
            <div className="space-y-6">
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h3 className="font-bold text-white mb-4">Site Information</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold">Site ID</label>
                            <p className="text-slate-300 font-mono text-sm">{site.id}</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold">Status</label>
                            <p className="text-slate-300 text-sm capitalize">{site.status}</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold">Created</label>
                            <p className="text-slate-300 text-sm">{new Date(site.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SiteOverview;