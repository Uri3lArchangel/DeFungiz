// app/collections/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { motion } from "framer-motion";
import { useAppContext } from "@/src/context/AppContext";
import Image from "next/image";

const CollectionsPage = () => {
  const { isConnected, account, isNetworkValid, connectWallet } = useWallet();
  const { showNotification } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [collections, setCollections] = useState<any[]>([]);
  const [sortOption, setSortOption] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });

  // Fetch collections from backend
  useEffect(() => {
    const fetchCollections = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          sort: sortOption,
          search: searchQuery,
        });

        const response = await fetch(`/api/collections?${queryParams}`);

        if (!response.ok) {
          throw new Error("Failed to fetch collections");
        }

        const data = await response.json();
        setCollections(data.collections || []);
        setPagination(
          data.pagination || {
            page: 1,
            limit: 12,
            total: 0,
            totalPages: 1,
          }
        );
      } catch (error) {
        console.error("Error fetching collections:", error);
        showNotification("Failed to load collections", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, [
    isConnected,
    isNetworkValid,
    account,
    sortOption,
    searchQuery,
    pagination.page,
  ]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-[#0a0f1f] text-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto z-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-12">
            <div className="lg:w-1/2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                NFT Collections
              </h1>
              <p className="mt-6 text-xl text-gray-300 max-w-2xl">
                Discover unique NFT collections powered by 0G Chain&apos;s
                revolutionary blockchain technology.
              </p>

              <div className="mt-10">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    placeholder="Search collections..."
                    className="w-full bg-gray-900/70 backdrop-blur-sm border border-cyan-900/50 rounded-xl py-4 pl-5 pr-12 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors duration-300">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 relative">
              <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-cyan-900/50 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold">0G Chain Stats</h3>
                    <p className="text-cyan-500 text-sm">
                      Real-time blockchain data
                    </p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-green-500 text-sm">Live</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 p-4 rounded-xl border border-cyan-800/30">
                    <div className="text-cyan-400 text-2xl font-bold">
                      0.001 OG
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                      Avg. Transaction Cost
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 p-4 rounded-xl border border-cyan-800/30">
                    <div className="text-cyan-400 text-2xl font-bold">
                      50,000+
                    </div>
                    <div className="text-gray-400 text-sm mt-1">
                      Transactions Per Second
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 p-4 rounded-xl border border-cyan-800/30">
                    <div className="text-cyan-400 text-2xl font-bold">8K+</div>
                    <div className="text-gray-400 text-sm mt-1">
                      Active Validators
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 p-4 rounded-xl border border-cyan-800/30">
                    <div className="text-cyan-400 text-2xl font-bold">6M+</div>
                    <div className="text-gray-400 text-sm mt-1">
                      User Accounts
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collections Section */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h2 className="text-2xl font-bold">
              {searchQuery
                ? `Search Results for "${searchQuery}"`
                : "All Collections"}
              <span className="text-cyan-500 ml-2">({pagination.total})</span>
            </h2>

            <div className="flex items-center space-x-4">
              <div className="text-gray-400">Sort by:</div>
              <select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="volume">Highest Volume</option>
                <option value="floor">Highest Floor</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl overflow-hidden"
                >
                  <div className="h-48 bg-gray-800/50 animate-pulse"></div>
                  <div className="p-4">
                    <div className="h-5 bg-gray-700/50 rounded animate-pulse mb-3"></div>
                    <div className="h-4 w-32 bg-gray-700/50 rounded animate-pulse mb-4"></div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-4 w-16 bg-cyan-900/50 rounded animate-pulse"></div>
                      <div className="h-4 w-16 bg-cyan-900/50 rounded animate-pulse"></div>
                      <div className="h-4 w-16 bg-cyan-900/50 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-cyan-500 text-5xl mb-4">
                <i className="fas fa-box-open"></i>
              </div>
              <h3 className="text-2xl font-bold mb-2">No Collections Found</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                We couldn&apos;t find any collections matching your search. Try
                different keywords or explore trending collections.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="mt-6 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white px-6 py-3 rounded-lg transition-all duration-300"
              >
                View All Collections
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {collections.map((collection, index) => (
                  <Link
                    key={collection._id}
                    href={`/explore/collection/${collection._id}`}
                    className="block"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gradient-to-br from-gray-900/50 to-[#0d1325] border border-cyan-900/30 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-cyan-900/10 transition-all duration-300 group cursor-pointer h-full"
                    >
                      <div className="relative h-48 overflow-hidden">
                        {collection.previewImage ? (
                          <Image
                            src={collection.previewImage}
                            alt={collection.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/20 to-blue-900/20 flex items-center justify-center">
                            <div className="bg-gray-800/50 rounded-full w-16 h-16 flex items-center justify-center">
                              <i className="fas fa-layer-group text-cyan-500 text-2xl"></i>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-lg group-hover:text-cyan-400 transition-colors duration-300">
                              {collection.name}
                            </h3>
                            <div className="text-cyan-500 text-sm mt-1">
                              by{" "}
                              <span className="hover:text-cyan-400 transition-colors duration-300">
                                {collection.creator.substring(0, 6)}...
                                {collection.creator.substring(
                                  collection.creator.length - 4
                                )}
                              </span>
                            </div>
                          </div>
                          {collection.isVerified && (
                            <div className="text-cyan-400">
                              <i className="fas fa-check-circle"></i>
                            </div>
                          )}
                        </div>

                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                          {collection.description || "No description available"}
                        </p>

                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-xs text-gray-400">Floor</div>
                            <div className="text-cyan-400 font-medium">
                              {collection.stats?.floorPrice || 0} OG
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Volume</div>
                            <div className="text-cyan-400 font-medium">
                              {collection.stats?.totalVolume || 0} OG
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Items</div>
                            <div className="text-cyan-400 font-medium">
                              {collection.stats?.totalItems || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-10">
                  <div className="flex space-x-2">
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        const pageNum: number =
                          pagination.totalPages <= 5
                            ? i + 1
                            : pagination.page <= 3
                            ? i + 1
                            : pagination.page >= pagination.totalPages - 2
                            ? pagination.totalPages - 4 + i
                            : pagination.page - 2 + i;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              pageNum === pagination.page
                                ? "bg-cyan-600 text-white"
                                : "bg-gray-800/50 hover:bg-gray-700 text-gray-300"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* 0G Features Section */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Why Build on 0G Chain?
              </h2>
              <p className="mt-4 text-xl text-gray-400 max-w-3xl mx-auto">
                Leverage 0G Labs&apos; revolutionary blockchain technology for your
                NFT collections
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-bolt text-white"></i>
                </div>
                <h3 className="text-xl font-bold text-white">
                  Ultra-Low Gas Fees
                </h3>
                <p className="mt-3 text-gray-400">
                  Mint and trade NFTs with minimal transaction costs thanks to
                  0G&apos;s efficient architecture. Average cost is just $0.001 per
                  transaction.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-tachometer-alt text-white"></i>
                </div>
                <h3 className="text-xl font-bold text-white">
                  Blazing Fast Speed
                </h3>
                <p className="mt-3 text-gray-400">
                  Experience near-instant transactions with 0G&apos;s high-throughput
                  blockchain capable of processing thousands of transactions per
                  second.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-shield-alt text-white"></i>
                </div>
                <h3 className="text-xl font-bold text-white">
                  Enterprise-Grade Security
                </h3>
                <p className="mt-3 text-gray-400">
                  Your assets are protected by 0G&apos;s robust consensus mechanism
                  and decentralized validator network with military-grade
                  encryption.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to Create Your Own Collection?
          </h2>
          <p className="mt-4 text-xl text-cyan-200 max-w-3xl mx-auto">
            Launch your NFT collection on 0G Chain and experience near-zero gas
            fees and instant transactions
          </p>

          <div className="mt-10">
            <Link
              href="/create"
              className="relative inline-block bg-gradient-to-r from-cyan-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-900/30"
            >
              Create Collection
            </Link>

            <div className="mt-6 text-cyan-300">
              {isConnected ? (
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span>
                    Wallet connected: {account?.substring(0, 6)}...
                    {account?.substring(account.length - 4)}
                  </span>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="text-cyan-300 hover:text-cyan-200 underline flex items-center justify-center"
                >
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  <span>Connect your wallet to create a collection</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CollectionsPage;
