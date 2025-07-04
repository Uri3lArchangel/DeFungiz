// app/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';

const LandingPage = () => {
  const { isConnected, account, connectWallet } = useWallet();
  const [isLoading, setIsLoading] = useState(true);
  useEffect(()=>{
    setIsLoading(false)
  })


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-[#0a0f1f] text-white">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="lg:w-1/2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Discover, Collect & Trade NFTs on 0G Chain
              </h1>
              <p className="mt-6 text-xl text-gray-300 max-w-2xl">
                The next-generation NFT marketplace powered by 0G Labs&apos; high-performance blockchain. Experience instant trades, near-zero fees, and limitless scalability.
              </p>
              
              <div className="mt-10 flex flex-wrap gap-4">
                <button
                  onClick={connectWallet}
                  className="relative bg-gradient-to-r from-cyan-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-900/30 flex items-center"
                >
                  <span className="mr-2">Start Collecting</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </button>
                
                <Link href="/explore" className="px-8 py-4 rounded-xl font-bold border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:text-white transition-all duration-300">
                  Explore Marketplace
                </Link>
              </div>
              
              <div className="mt-16 grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400">
                    {isLoading ? (
                      <div className="h-8 w-16 bg-gray-800 rounded-md animate-pulse mx-auto"></div>
                    ) : (
                      <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        {/* Will be replaced with real data */}
                        ...
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-gray-400">Total Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400">
                    {isLoading ? (
                      <div className="h-8 w-16 bg-gray-800 rounded-md animate-pulse mx-auto"></div>
                    ) : (
                      <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        {/* Will be replaced with real data */}
                        ...
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-gray-400">Total Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400">
                    {isLoading ? (
                      <div className="h-8 w-16 bg-gray-800 rounded-md animate-pulse mx-auto"></div>
                    ) : (
                      <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        {/* Will be replaced with real data */}
                        ...
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-gray-400">Collections</div>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2 relative">
              <div className="relative">
                <div className="absolute -top-6 -right-6 w-full h-full border-4 border-cyan-500/30 rounded-2xl"></div>
                <div className="absolute -top-3 -right-3 w-full h-full border-4 border-cyan-500/20 rounded-2xl"></div>
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 border border-cyan-900/50 rounded-2xl overflow-hidden transform rotate-3">
                  <div className="p-6">
                    <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 p-4 rounded-xl mb-6">
                      <div className="flex justify-between items-center">
                        <div className="text-cyan-400 font-bold">Featured Collection</div>
                        <div className="bg-cyan-900/50 text-cyan-400 text-xs px-2 py-1 rounded">New</div>
                      </div>
                      <h3 className="text-xl font-bold mt-2">0G Genesis Collection</h3>
                      <p className="text-gray-400 text-sm mt-1">The inaugural NFT collection on 0G Chain</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-800/30 rounded-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
                        <div className="h-48 bg-gray-800/50 animate-pulse"></div>
                        <div className="p-3">
                          <div className="h-4 bg-gray-700/50 rounded animate-pulse"></div>
                          <div className="h-4 w-16 bg-cyan-900/50 rounded mt-2 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-800/30 rounded-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 cursor-pointer">
                        <div className="h-48 bg-gray-800/50 animate-pulse"></div>
                        <div className="p-3">
                          <div className="h-4 bg-gray-700/50 rounded animate-pulse"></div>
                          <div className="h-4 w-16 bg-cyan-900/50 rounded mt-2 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-sm text-gray-400">Powered by 0G Chain</div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-green-500 text-sm">Live</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0a0f1f] to-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Why Choose 0G NFT Marketplace?
            </h2>
            <p className="mt-4 text-xl text-gray-400 max-w-3xl mx-auto">
              Built on 0G Labs&apos; revolutionary blockchain technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Lightning Fast Transactions</h3>
              <p className="mt-3 text-gray-400">
                Experience near-instant transaction finality thanks to 0G&apos;s high-performance architecture. 
                No more waiting for confirmations.
              </p>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Near-Zero Gas Fees</h3>
              <p className="mt-3 text-gray-400">
                Create, trade, and collect NFTs with minimal transaction costs. 
                0G&apos;s efficient architecture makes microtransactions feasible.
              </p>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Massive Scalability</h3>
              <p className="mt-3 text-gray-400">
                Built to handle millions of transactions per second. 
                0G&apos;s modular architecture ensures the platform never slows down.
              </p>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Enterprise-Grade Security</h3>
              <p className="mt-3 text-gray-400">
                Your digital assets are protected by 0G&apos;s advanced cryptographic security 
                and decentralized consensus mechanism.
              </p>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Advanced NFT Capabilities</h3>
              <p className="mt-3 text-gray-400">
                Support for complex NFT types including dynamic, programmable, 
                and multi-asset NFTs with 0G&apos;s flexible storage.
              </p>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">Thriving Community</h3>
              <p className="mt-3 text-gray-400">
                Join a rapidly growing ecosystem of creators, collectors, 
                and developers building the future of digital ownership.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="mt-4 text-xl text-gray-400 max-w-3xl mx-auto">
              Get started in just a few simple steps
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-600/20 to-blue-700/20 rounded-3xl blur-lg"></div>
                <div className="relative bg-gray-900 border border-cyan-900/50 rounded-2xl overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start">
                      <div className="bg-gradient-to-r from-cyan-600 to-blue-700 rounded-lg p-3 mr-4">
                        <span className="text-white font-bold text-xl">1</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Create a Wallet</h3>
                        <p className="mt-2 text-gray-400">
                          Set up a Web3 wallet like MetaMask and connect to the 0G network. 
                          We&apos;ll help you switch automatically.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start mt-8">
                      <div className="bg-gradient-to-r from-cyan-600 to-blue-700 rounded-lg p-3 mr-4">
                        <span className="text-white font-bold text-xl">2</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Explore Collections</h3>
                        <p className="mt-2 text-gray-400">
                          Browse thousands of NFT collections created by artists and creators 
                          from around the world.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start mt-8">
                      <div className="bg-gradient-to-r from-cyan-600 to-blue-700 rounded-lg p-3 mr-4">
                        <span className="text-white font-bold text-xl">3</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Make Your First Purchase</h3>
                        <p className="mt-2 text-gray-400">
                          Buy your first NFT with near-zero gas fees and experience 
                          lightning-fast transaction speeds.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start mt-8">
                      <div className="bg-gradient-to-r from-cyan-600 to-blue-700 rounded-lg p-3 mr-4">
                        <span className="text-white font-bold text-xl">4</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Create & List Your NFTs</h3>
                        <p className="mt-2 text-gray-400">
                          Upload your digital creations and list them for sale in 
                          our creator-friendly marketplace.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="absolute top-10 right-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
                <div className="relative">
                  <h3 className="text-3xl font-bold text-white max-w-lg">
                    Built for the Future of Digital Ownership
                  </h3>
                  <p className="mt-6 text-xl text-gray-400">
                    0G NFT Marketplace leverages the cutting-edge technology of 0G Labs&apos; 
                    blockchain to deliver an unparalleled NFT experience. 
                  </p>
                  
                  <div className="mt-10 bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl p-6">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-cyan-600/20 to-blue-700/20 p-3 rounded-lg mr-4">
                        <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-white">0G Chain Technology</div>
                        <p className="mt-2 text-gray-400">
                          Modular architecture separating storage, consensus, and computation
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex mt-6">
                      <div className="flex-1 pr-2">
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                          <div className="text-cyan-400 text-lg font-bold">50,000+ TPS</div>
                          <div className="text-gray-400 text-sm mt-1">Transaction Speed</div>
                        </div>
                      </div>
                      <div className="flex-1 pl-2">
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                          <div className="text-cyan-400 text-lg font-bold">$0.001</div>
                          <div className="text-gray-400 text-sm mt-1">Avg. Transaction Cost</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Link href="https://docs.0g.ai/" target="_blank" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors duration-300">
                      <span>Explore 0G Technical Documentation</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to Explore the Future of NFTs?
          </h2>
          <p className="mt-4 text-xl text-cyan-200 max-w-3xl mx-auto">
            Join thousands of creators and collectors on the 0G NFT Marketplace
          </p>
          
          <div className="mt-10">
            <button
              onClick={connectWallet}
              className="relative bg-gradient-to-r from-cyan-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-900/30"
            >
              Connect Wallet & Get Started
            </button>
            
            <div className="mt-6 text-cyan-300">
              {isConnected ? (
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span>Wallet connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  <span>Connect your wallet to start your NFT journey</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;