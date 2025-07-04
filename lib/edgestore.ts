import { initEdgeStore } from '@edgestore/server';
import { createEdgeStoreNextHandler } from '@edgestore/server/adapters/next/app';

const es = initEdgeStore.create();

const edgeStoreRouter = es.router({
  _0gNft: es.fileBucket({
    maxSize: 1024 * 1024 * 200, // 200MB (increased for 3D files)
    accept: [
      'image/*', 
      'video/*', 
      'audio/*', 
      'model/gltf-binary',
      'application/octet-stream', // For OBJ/STL files
      '.glb',
      '.gltf',
      '.obj',
      '.stl'
    ],
  }),
});

export const handler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
});

export type EdgeStoreRouter = typeof edgeStoreRouter;