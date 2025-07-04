// app/context/WalletContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Web3 from 'web3';

interface WalletContextType {
  isConnected: boolean;
  account: string;
  isNetworkValid: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [isNetworkValid, setIsNetworkValid] = useState(true);

  useEffect(() => {
    if (!isNetworkValid) {
      switchTo0GNetwork();
    }
  }, [isNetworkValid]);

  const checkNetwork = async () => {
    if (window.ethereum) {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      setIsNetworkValid(chainId === '0x40d9');
      return chainId === '0x40d9';
    }
    return false;
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3 = new Web3(window.ethereum);
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        setIsConnected(true);
        setAccount(accounts[0]);
        await checkNetwork();
        
      } catch (error) {
        console.error('Connection error:', error);
      }
    } else {
      alert('Please install an Ethereum-compatible wallet!');
    }
  };

  const switchTo0GNetwork = async () => {
    const chainIdHex = '0x40d9';
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }]
      });
      setIsNetworkValid(true);
    } catch (switchError: any) {
      // ... (keep existing network switching logic)
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAccount('');
  };

  // Add account change listener
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]); // Update account when changed
      } else {
        disconnectWallet(); // Disconnect if no accounts
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Cleanup
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [account]); // Empty dependency array to run only once

  // Initialize wallet connection
  useEffect(() => {
    const initWallet = async () => {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.requestAccounts();
        if (accounts.length > 0) {
          setIsConnected(true);
          setAccount(accounts[0]);
          await checkNetwork();
        }
      }
    };
    initWallet();
  }, [account]);

  return (
    <WalletContext.Provider value={{ 
      isConnected, 
      account, 
      isNetworkValid,
      connectWallet, 
      disconnectWallet
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};