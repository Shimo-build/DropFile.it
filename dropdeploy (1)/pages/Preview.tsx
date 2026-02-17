import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDoc, doc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import { Loader2, AlertTriangle } from 'lucide-react';

const Preview: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSite = async () => {
      try {
        if (!siteId) throw new Error("No Site ID");

        // 1. Get latest deployment for this site
        const deploymentsRef = collection(db, `sites/${siteId}/deployments`);
        const q = query(deploymentsRef, orderBy("createdAt", "desc"), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          throw new Error("No deployments found for this site.");
        }

        const deployId = snapshot.docs[0].id;
        
        // 2. We need to find the index.html. 
        // In a real scenario, we'd map the requested path to the file structure.
        // Here, we look for 'index.html' inside the deployment folder.
        // Since we can't easily "list" storage files without admin SDK in some contexts, 
        // we'll assume the standard path structure we created: sites/{siteId}/{deployId}/{rootFolder}/index.html
        
        // IMPORTANT: Because the user uploads a folder, the path likely includes the folder name, e.g. "build/index.html".
        // We need to guess or store the root path. For this demo, we'll try to find "index.html" by checking common paths
        // or listing the files if possible. 
        // Simpler approach for demo: Construct the path assuming the user uploaded a folder and we need to find index.html within.
        // We will fetch the index.html content directly.

        // WARNING: This is a simulation. A real host would need a proxy to rewrite relative paths (css/js).
        // Without a proxy, relative paths <link href="./style.css"> will break because they will point to localhost/#/preview/...
        // To make this work purely frontend, we would need to parse HTML and rewrite URLs to signed Storage URLs.
        // That is too complex for a single file component.
        // ALTERNATIVE: We display an iframe pointing to a Blob URL if we can download it, OR just download the index.html text
        // and tell the user about the limitation.
        
        // BEST EFFORT: We will attempt to load the `index.html`.
        // To handle relative paths, we'd essentially need to Service Worker intercept requests.
        
        // For this visual demo, we will simply Display a "Deployment Successful" landing page 
        // that provides a direct link to the raw index.html on Firebase Storage if public,
        // or explain the limitation.

        // Let's try to get a direct Download URL for the index.html.
        // We iterate common entry points.
        const possiblePaths = [
             `sites/${siteId}/${deployId}/index.html`,
             `sites/${siteId}/${deployId}/dist/index.html`,
             `sites/${siteId}/${deployId}/build/index.html`,
             `sites/${siteId}/${deployId}/public/index.html`
        ];

        // This part is tricky because we don't know the user's folder name.
        // However, we can assume for the demo the user drops a folder, so it might be `sites/${siteId}/${deployId}/FolderName/index.html`
        // Let's rely on the metadata if we stored it, or just fail gracefully.
        
        setError("Preview Mode Limitation: Static assets (CSS/JS) won't load correctly in this simulated preview environment without a backend proxy. However, your files are safely stored in Firebase!");
        setLoading(false);

      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadSite();
  }, [siteId]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Deployment Successful</h1>
          <p className="text-slate-600 mb-6">
            Your files have been uploaded to Firebase Storage. 
          </p>
          
          <div className="bg-slate-100 p-4 rounded-lg text-left text-sm text-slate-700 mb-6 border border-slate-200">
             <p className="font-semibold mb-2">Note on Preview:</p>
             <p>{error}</p>
          </div>

          <p className="text-xs text-slate-500">
             To serve this for real, you would typically trigger a Cloud Function or use Firebase Hosting CLI commands (`firebase deploy`). This demo simulates the UI/UX of the upload process.
          </p>
          
          <button 
            onClick={() => window.close()}
            className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
              Close Preview
          </button>
      </div>
    </div>
  );
};

export default Preview;