// app/components/Navbar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import { createUser, getUser } from '@/lib/user';

const Navbar = () => {
  const pathname = usePathname();
  const { 
    isConnected, 
    account, 
    connectWallet, 
    isNetworkValid,
    disconnectWallet
  } = useWallet();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const shortenAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const handleConnect = async () => {
    await connectWallet();
    const user = await createUser(account);
    if (!user.success) {
      console.error('Failed to create user:', user.error);
      disconnectWallet();
    }
  };

  const isActive = (href: string) => {
    if (href === '/') return false;
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-[#0a0b0e] border-b border-cyan-900/50 backdrop-blur-lg bg-opacity-90 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 w-8 h-8 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-all duration-300">
                <span className="text-white font-bold text-lg">0G</span>
              </div>
              <span className="text-white font-bold text-xl ml-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text ">
                NFT Marketplace
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:block ml-12">
              <div className="flex space-x-8">
                <Link href="/explore" className={`${isActive('/explore') ? 'text-cyan-400' : 'text-gray-300'} hover:text-white transition-all duration-300 font-medium group`}>
                  Explore
                  <span className={`block h-0.5 mt-1 transition-all duration-300 ${isActive('/explore') ? 'w-full bg-gradient-to-r from-cyan-400 to-blue-500' : 'w-0 bg-gray-300 group-hover:w-full'}`}></span>
                </Link>
                <Link href="/create" className={`${isActive('/create') ? 'text-cyan-400' : 'text-gray-300'} hover:text-white transition-all duration-300 font-medium group`}>
                  Create
                  <span className={`block h-0.5 mt-1 transition-all duration-300 ${isActive('/create') ? 'w-full bg-gradient-to-r from-cyan-400 to-blue-500' : 'w-0 bg-gray-300 group-hover:w-full'}`}></span>
                </Link>
                <Link href="/collections" className={`${isActive('/collections') ? 'text-cyan-400' : 'text-gray-300'} hover:text-white transition-all duration-300 font-medium group`}>
                  Collections
                  <span className={`block h-0.5 mt-1 transition-all duration-300 ${isActive('/collections') ? 'w-full bg-gradient-to-r from-cyan-400 to-blue-500' : 'w-0 bg-gray-300 group-hover:w-full'}`}></span>
                </Link>
             
              </div>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center">
            {/* Search Bar */}
            <div className="hidden md:block mr-4 relative">
              <input 
                type="text" 
                placeholder="Search collections, NFTs..." 
                className="bg-gray-800/70 border border-gray-700 rounded-lg pl-4 pr-10 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-64 transition-all duration-300"
              />
              <svg 
                className="w-5 h-5 text-gray-400 absolute right-3 top-2.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>

            {!isConnected ? (
              <button
                onClick={handleConnect}
                className="relative bg-gradient-to-r from-cyan-600 to-blue-700 text-white px-6 py-2 rounded-lg font-medium hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-900/30 group"
              >
                <span className="flex items-center">
                  Connect Wallet
                  <svg 
                    className="w-5 h-5 ml-2 group-hover:animate-pulse" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </span>
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 bg-gray-800/80 hover:bg-gray-700/90 border border-gray-700 px-4 py-2 rounded-lg transition-all duration-300 group"
                >
                  <div className={`w-3 h-3 rounded-full ${isNetworkValid ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                  <span className="font-medium text-gray-200 group-hover:text-white">
                    {shortenAddress(account)}
                  </span>
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-cyan-900/50 rounded-xl shadow-lg overflow-hidden transition-all duration-300 origin-top-right transform-gpu z-10 backdrop-blur-lg">
                    <div className="p-4 border-b border-cyan-900/30">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-full w-10 h-10 flex items-center justify-center">
                          <span className="text-white font-bold">{account.substring(2,4).toUpperCase()}</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-white">{shortenAddress(account)}</p>
                          <p className="text-xs flex items-center mt-1">
                            {isNetworkValid ? (
                              <span className="bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                0G Network
                              </span>
                            ) : (
                              <span className="bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded-full flex items-center">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                                Wrong Network
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-1">
                      <Link href="/profile" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-3 text-sm text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors duration-200 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        My Profile
                      </Link>
                    
                      
                    </div>
                    
                    <div className="p-2 border-t border-gray-800">
                      <button 
                        onClick={() => {
                          disconnectWallet();
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-sm font-medium text-center text-red-400 hover:text-red-300 transition-colors duration-200 flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden cursor-pointer ml-4 text-gray-300 hover:text-white focus:outline-none"
          >
            <svg className="h-6 w-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-900/95 backdrop-blur-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <div className="relative px-3 py-2">
              <input 
                type="text" 
                placeholder="Search collections, NFTs..." 
                className="bg-gray-800/70 border border-gray-700 rounded-lg pl-4 pr-10 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-full"
              />
              <svg 
                className="w-5 h-5 text-gray-400 absolute right-5 top-3.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            
            <Link 
              href="/explore" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg font-medium hover:bg-gray-800/50 transition-colors duration-200 ${isActive('/explore') ? 'text-cyan-400' : 'text-gray-300 hover:text-white'}`}
            >
              Explore
            </Link>
            <Link 
              href="/create" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg font-medium hover:bg-gray-800/50 transition-colors duration-200 ${isActive('/create') ? 'text-cyan-400' : 'text-gray-300 hover:text-white'}`}
            >
              Create
            </Link>
            <Link 
              href="/collections" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg font-medium hover:bg-gray-800/50 transition-colors duration-200 ${isActive('/collections') ? 'text-cyan-400' : 'text-gray-300 hover:text-white'}`}
            >
              Collections
            </Link>
         
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;