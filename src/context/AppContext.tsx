'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type AppContextType = {
  isLoading: boolean;
  error: string | null;
  success: string | null;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    if (type === 'success') {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 5000);
    } else if (type === 'error') {
      setError(message);
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <AppContext.Provider
      value={{
        isLoading,
        error,
        success,
        setLoading: setIsLoading,
        setError,
        setSuccess,
        showNotification,
      }}
    >
      {children}
      {/* Notification Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
            <button 
              onClick={() => setError(null)} 
              className="ml-4 text-white hover:text-gray-200"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
      {success && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
            <i className="fas fa-check-circle mr-2"></i>
            {success}
            <button 
              onClick={() => setSuccess(null)} 
              className="ml-4 text-white hover:text-gray-200"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-900 p-8 rounded-xl max-w-md w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500 mb-4"></div>
              <h3 className="text-xl font-bold text-white mb-2">Processing</h3>
              <p className="text-gray-400 text-center">Your NFT is being created. Please wait...</p>
              <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4">
                <div 
                  className="bg-cyan-500 h-2.5 rounded-full animate-pulse" 
                  style={{ width: '50%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};