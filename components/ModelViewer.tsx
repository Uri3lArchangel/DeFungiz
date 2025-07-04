// components/ModelViewer.tsx
'use client';

import { useEffect, useRef } from 'react';

interface ModelViewerProps {
  src: string;
}

const ModelViewer = ({ src }: ModelViewerProps) => {
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && viewerRef.current) {
      // Load your 3D viewer library here (like Three.js, model-viewer, etc.)
      // Example using model-viewer web component:
      const modelViewer = document.createElement('model-viewer');
      modelViewer.setAttribute('src', src);
      modelViewer.setAttribute('auto-rotate', '');
      modelViewer.setAttribute('camera-controls', '');
      modelViewer.style.width = '100%';
      modelViewer.style.height = '100%';
      
      viewerRef.current.appendChild(modelViewer);

      return () => {
        if (viewerRef.current && modelViewer.parentNode === viewerRef.current) {
          viewerRef.current.removeChild(modelViewer);
        }
      };
    }
  }, [src]);

  return <div ref={viewerRef} className="w-full h-full" />;
};

export default ModelViewer;