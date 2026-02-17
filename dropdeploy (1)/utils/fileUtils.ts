import { FileNode } from '../types';

// Helper to traverse a directory entry
const traverseFileTree = async (item: any, path: string = ''): Promise<FileNode[]> => {
  if (item.isFile) {
    return new Promise((resolve) => {
      item.file((file: File) => {
        resolve([{ path: path + file.name, file }]);
      });
    });
  } else if (item.isDirectory) {
    const dirReader = item.createReader();
    const entries: any[] = await new Promise((resolve) => {
      dirReader.readEntries((entries: any[]) => resolve(entries));
    });
    
    const promises = entries.map((entry) => traverseFileTree(entry, path + item.name + "/"));
    const results = await Promise.all(promises);
    return results.flat();
  }
  return [];
};

export const getFilesFromDrop = async (items: DataTransferItemList): Promise<FileNode[]> => {
  const promises: Promise<FileNode[]>[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const entry = item.webkitGetAsEntry();
    
    if (entry) {
      promises.push(traverseFileTree(entry));
    }
  }
  
  const results = await Promise.all(promises);
  return results.flat();
};
