import React, { useState, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { storage, db } from '../firebaseConfig';
import { FileNode } from '../types';
import { getFilesFromDrop } from '../utils/fileUtils';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, File, AlertCircle, CheckCircle2, Loader2, Folder } from 'lucide-react';
import { clsx } from 'clsx';

interface DeployProps {
  user: User;
}

const Deploy: React.FC<DeployProps> = ({ user }) => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    setStatusMsg('Reading files...');

    try {
      if (e.dataTransfer.items) {
        const droppedFiles = await getFilesFromDrop(e.dataTransfer.items);
        if (droppedFiles.length === 0) {
          setError("No files found. Please drop a folder with content.");
          return;
        }
        setFiles(droppedFiles);
      }
    } catch (err) {
        console.error(err);
        setError("Error reading directory. Please try again.");
    }
  }, []);

  const handleManualSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const selectedFiles: FileNode[] = Array.from(e.target.files).map((f: File) => ({
              // webkitRelativePath gives us "Folder/File.txt"
              path: f.webkitRelativePath, 
              file: f
          }));
          setFiles(selectedFiles);
      }
  }

  const deploy = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      // 1. Create Site ID
      const timestamp = Date.now();
      const siteName = `site-${Math.random().toString(36).substring(7)}`; // Random name for now
      
      // Determine a friendly name based on root folder if possible
      let friendlyName = siteName;
      const rootFolder = files[0].path.split('/')[0];
      if (rootFolder) friendlyName = rootFolder;

      // 2. Register Site in Firestore
      const siteRef = await addDoc(collection(db, "sites"), {
        name: friendlyName,
        ownerId: user.uid,
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'deploying',
        deploymentCount: 1
      });

      const siteId = siteRef.id;

      // 3. Register Deployment
      const deployRef = await addDoc(collection(db, `sites/${siteId}/deployments`), {
        status: 'building',
        createdAt: timestamp,
        fileCount: files.length,
        authorName: user.displayName || 'Unknown',
        size: files.reduce((acc, curr) => acc + curr.file.size, 0)
      });
      const deployId = deployRef.id;

      // 4. Upload Files
      let uploadedCount = 0;
      const uploadPromises = files.map(async (fileNode) => {
        // Remove root folder name from path for cleaner hosting simulation if desired, 
        // but keeping it ensures structure. 
        // We will store as: sites/{siteId}/{deployId}/{path}
        const storagePath = `sites/${siteId}/${deployId}/${fileNode.path}`;
        const fileRef = ref(storage, storagePath);
        
        await uploadBytes(fileRef, fileNode.file);
        
        uploadedCount++;
        setProgress(Math.round((uploadedCount / files.length) * 100));
        setStatusMsg(`Uploading ${uploadedCount}/${files.length}: ${fileNode.path}`);
      });

      await Promise.all(uploadPromises);

      // 5. Finalize
      const previewUrl = `${window.location.origin}/#/preview/${siteId}`; // Using local preview route
      
      await updateDoc(doc(db, "sites", siteId), {
        status: 'live',
        url: previewUrl,
        updatedAt: Date.now()
      });

      await updateDoc(doc(db, `sites/${siteId}/deployments`, deployId), {
        status: 'ready'
      });

      setStatusMsg('Deployment Complete!');
      // Navigate to site details
      setTimeout(() => navigate(`/site/${siteId}`), 1000);

    } catch (err: any) {
      console.error(err);
      setError("Deployment failed: " + err.message);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">New Deployment</h1>
        <p className="text-slate-400">Drag and drop your build folder here to deploy.</p>
      </div>

      <div 
        className={clsx(
          "relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center min-h-[400px]",
          isDragging 
            ? "border-blue-500 bg-blue-500/10 scale-[1.02]" 
            : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={uploading ? undefined : onDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center w-full max-w-md">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
            <h3 className="text-xl font-semibold text-white mb-2">Deploying...</h3>
            <p className="text-slate-400 mb-6 text-center text-sm font-mono truncate w-full">{statusMsg}</p>
            
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-right w-full text-xs text-slate-500 mt-2">{progress}%</p>
          </div>
        ) : files.length > 0 ? (
          <div className="w-full">
            <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
            </div>
            <h3 className="text-xl font-semibold text-white text-center mb-2">Ready to deploy!</h3>
            <p className="text-slate-400 text-center mb-8">
              {files.length} files found in <strong>{files[0].path.split('/')[0]}</strong>
            </p>
            
            <div className="flex gap-4 justify-center">
                <button 
                    onClick={() => setFiles([])}
                    className="px-6 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={deploy}
                    className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                >
                    Deploy Site
                </button>
            </div>

            <div className="mt-8 max-h-48 overflow-y-auto bg-slate-900 rounded-lg p-4 border border-slate-700">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sticky top-0 bg-slate-900">File Preview</h4>
                {files.slice(0, 50).map((f, i) => (
                    <div key={i} className="text-xs text-slate-400 py-1 border-b border-slate-800/50 flex items-center gap-2">
                        <File className="w-3 h-3" />
                        {f.path}
                    </div>
                ))}
                {files.length > 50 && <div className="text-xs text-slate-500 pt-2 text-center">And {files.length - 50} more...</div>}
            </div>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-xl">
              <UploadCloud className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Drop your project folder</h3>
            <p className="text-slate-400 mb-8 text-center max-w-sm">
              Drag and drop your build output folder (e.g., build, dist, public) here.
            </p>
            
            <div className="relative">
                <input 
                    type="file" 
                    // @ts-ignore
                    webkitdirectory=""
                    directory=""
                    multiple
                    ref={fileInputRef}
                    className="hidden" 
                    onChange={handleManualSelect}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white font-medium hover:bg-slate-700 hover:border-slate-500 transition-all flex items-center gap-2"
                >
                    <Folder className="w-5 h-5" />
                    Browse Files
                </button>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 animate-fadeIn">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default Deploy;