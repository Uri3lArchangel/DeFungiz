// app/explore/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

const ExplorePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State initialization from URL params
  const getInitialState = () => {
    const params = new URLSearchParams(searchParams.toString());
    return {
      selectedCategory: params.get("category") || "all",
      sortOption: params.get("sort") || "recent",
      searchQuery: params.get("search") || "",
      minPrice: params.get("minPrice") || "",
      maxPrice: params.get("maxPrice") || "",
    };
  };

  const [state, setState] = useState(getInitialState);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [nfts, setNfts] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Update URL with current filters
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();

    if (state.selectedCategory !== "all")
      params.set("category", state.selectedCategory);
    if (state.sortOption !== "recent") params.set("sort", state.sortOption);
    if (state.searchQuery) params.set("search", state.searchQuery);
    if (state.minPrice) params.set("minPrice", state.minPrice);
    if (state.maxPrice) params.set("maxPrice", state.maxPrice);

    router.replace(`/explore?${params.toString()}`, { scroll: false });
  }, [state, router]);

  // Fetch NFTs with current filters
  const fetchNFTs = useCallback(
    async (reset = false) => {
      try {
        setIsLoading(true);
        const currentPage = reset ? 1 : page;

        const queryParams = new URLSearchParams({
          query: state.searchQuery,
          category: state.selectedCategory,
          minPrice: state.minPrice || "0",
          maxPrice: state.maxPrice || "1000000",
          sort: state.sortOption,
          page: currentPage.toString(),
          limit: "20",
        });

        const res = await fetch(`/api/nfts/search?${queryParams}`);

        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`);
        }

        const data = await res.json();

        if (reset) {
          setNfts(data.nfts || []);
          setPage(1);
        } else {
          setNfts((prev) => [...prev, ...(data.nfts || [])]);
        }

        setTotalItems(data.total || 0);
        setHasMore(data.page < data.totalPages);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
        setNfts([]);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    },
    [state, page]
  );

  // Initial data fetch and URL param sync
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);

        // Sync state with URL params
        setState(getInitialState());

        // Fetch categories
        const categoriesRes = await fetch("/api/nfts/categories");
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }

        // Fetch initial NFTs
        await fetchNFTs(true);

        // Fetch collections
        const collectionsRes = await fetch("/api/collections/search?limit=20");
        if (collectionsRes.ok) {
          const collectionsData = await collectionsRes.json();
          setCollections(collectionsData.collections || []);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, [searchParams]);

  // Load more NFTs for pagination
  const loadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchNFTs();
  };

  // Reset all filters
  const resetFilters = async () => {
    setState({
      selectedCategory: "all",
      sortOption: "recent",
      searchQuery: "",
      minPrice: "",
      maxPrice: "",
    });
    router.replace("/explore", { scroll: false });
    await fetchNFTs(true);
  };

  // Apply filters
  const applyFilters = async () => {
    updateURL();
    await fetchNFTs(true);
    setIsFiltersOpen(false);
  };

  // Handle sort change
  const handleSortChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setState((prev) => ({ ...prev, sortOption: newSort }));
    updateURL();
    await fetchNFTs(true);
  };

  // Handle search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    updateURL();
    await fetchNFTs(true);
  };

  // Update state when filters change
  const handleFilterChange = (key: string, value: string) => {
    setState((prev) => ({ ...prev, [key]: value }));
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
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Explore NFTs
            </h1>
            <p className="mt-4 text-xl text-gray-400 max-w-3xl mx-auto">
              Discover unique digital assets on the 0G blockchain
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-10 max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={state.searchQuery}
                  onChange={(e) =>
                    handleFilterChange("searchQuery", e.target.value)
                  }
                  placeholder="Search collections, NFTs, or creators..."
                  className="w-full bg-gray-900/70 backdrop-blur-sm border border-cyan-900/50 rounded-xl py-4 pl-5 pr-12 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-cyan-600 hover:bg-cyan-500 p-2 rounded-lg transition-all duration-300 cursor-pointer"
                >
                  <svg
                    className="w-5 h-5 text-white"
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
            </form>
          </div>
        </div>
      </section>

      {/* Filters and Content */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Active Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {state.selectedCategory !== "all" && (
              <span className="bg-cyan-900/30 text-cyan-400 px-3 py-1 rounded-full text-sm flex items-center">
                {categories.find((c) => c.id === state.selectedCategory)
                  ?.name || state.selectedCategory}
                <button
                  onClick={() => {
                    handleFilterChange("selectedCategory", "all");
                    updateURL();
                    fetchNFTs(true);
                  }}
                  className="ml-2"
                >
                  ×
                </button>
              </span>
            )}

            {state.searchQuery && (
              <span className="bg-cyan-900/30 text-cyan-400 px-3 py-1 rounded-full text-sm flex items-center">
                Search: {state.searchQuery}
                <button
                  onClick={() => {
                    handleFilterChange("searchQuery", "");
                    updateURL();
                    fetchNFTs(true);
                  }}
                  className="ml-2"
                >
                  ×
                </button>
              </span>
            )}

            {(state.minPrice || state.maxPrice) && (
              <span className="bg-cyan-900/30 text-cyan-400 px-3 py-1 rounded-full text-sm flex items-center">
                Price: {state.minPrice || "0"} - {state.maxPrice || "∞"} OG
                <button
                  onClick={() => {
                    handleFilterChange("minPrice", "");
                    handleFilterChange("maxPrice", "");
                    updateURL();
                    fetchNFTs(true);
                  }}
                  className="ml-2"
                >
                  ×
                </button>
              </span>
            )}

            {state.sortOption !== "recent" && (
              <span className="bg-cyan-900/30 text-cyan-400 px-3 py-1 rounded-full text-sm flex items-center">
                Sorted by:{" "}
                {{
                  "price-low": "Price: Low to High",
                  "price-high": "Price: High to Low",
                  popular: "Most Popular",
                }[state.sortOption] || state.sortOption}
                <button
                  onClick={() => {
                    handleFilterChange("sortOption", "recent");
                    updateURL();
                    fetchNFTs(true);
                  }}
                  className="ml-2"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div className="flex items-center space-x-4 mb-6 md:mb-0">
              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="md:hidden flex items-center bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 px-4 py-2 rounded-lg hover:bg-gray-800 transition-all duration-300 cursor-pointer"
              >
                <svg
                  className="w-5 h-5 mr-2 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  ></path>
                </svg>
                Filters
              </button>
              <h2 className="text-2xl font-bold">
                {state.selectedCategory === "all"
                  ? "All NFTs"
                  : categories.find((c) => c.id === state.selectedCategory)
                      ?.name}
                {totalItems > 0 && (
                  <span className="text-gray-400 text-sm ml-2">
                    ({totalItems} items)
                  </span>
                )}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-gray-400">Sort by:</div>
              <select
                value={state.sortOption}
                onChange={handleSortChange}
                className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 cursor-pointer"
              >
                <option value="recent">Recently Added</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Filters Sidebar */}
            <div
              className={`md:w-1/4 ${
                isFiltersOpen ? "block" : "hidden md:block"
              }`}
            >
              <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">Filters</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsFiltersOpen(false)}
                      className="md:hidden text-gray-400 hover:text-white cursor-pointer"
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="font-medium mb-4">Categories</h4>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() =>
                          handleFilterChange("selectedCategory", category.id)
                        }
                        className={`block w-full text-left px-4 py-2 rounded-lg transition-all duration-300 cursor-pointer ${
                          state.selectedCategory === category.id
                            ? "bg-cyan-900/30 text-cyan-400"
                            : "hover:bg-gray-800/50"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <h4 className="font-medium mb-4">Price Range (OG)</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        value={state.minPrice}
                        onChange={(e) =>
                          handleFilterChange("minPrice", e.target.value)
                        }
                        placeholder="Min"
                        className="w-24 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                      <span className="text-gray-400">to</span>
                      <input
                        type="number"
                        value={state.maxPrice}
                        onChange={(e) =>
                          handleFilterChange("maxPrice", e.target.value)
                        }
                        placeholder="Max"
                        className="w-24 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={applyFilters}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 py-2 rounded-lg transition-all duration-300 cursor-pointer"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* NFT Grid */}
            <div className="md:w-3/4">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <div
                      key={index}
                      className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-cyan-900/10 transition-all duration-300"
                    >
                      <div className="h-72 bg-gray-800/50 animate-pulse"></div>
                      <div className="p-4">
                        <div className="h-5 bg-gray-700/50 rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-24 bg-gray-700/50 rounded animate-pulse mb-4"></div>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-xs text-gray-400 mb-1">
                              Price
                            </div>
                            <div className="h-5 w-16 bg-cyan-900/50 rounded animate-pulse"></div>
                          </div>
                          <div className="h-10 w-24 bg-gray-700/50 rounded-lg animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : nfts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nfts.map((nft) =>
                      nft.isListed ? (
                        <div
                          key={nft._id || nft.id}
                          className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-cyan-900/10 transition-all duration-300 group cursor-pointer"
                          onClick={() =>
                            router.push(`/explore/nft/${nft._id || nft.id}`)
                          }
                        >
                          <div className="aspect-square bg-gray-800 relative overflow-hidden">
                            {nft.assetType === "image" ? (
                              <Image
                                src={nft.assetUrl}
                                alt={nft.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                <div className="text-cyan-400 text-5xl">
                                  {nft.assetType === "video" && (
                                    <i className="fas fa-video"></i>
                                  )}
                                  {nft.assetType === "audio" && (
                                    <i className="fas fa-music"></i>
                                  )}
                                  {nft.assetType === "3d" && (
                                    <i className="fas fa-cube"></i>
                                  )}
                                </div>
                              </div>
                            )}
                            {nft.collection && (
                              <div className="absolute bottom-2 left-2 bg-gray-900/80 text-xs px-2 py-1 rounded-lg">
                                {nft.collection.name}
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold text-lg group-hover:text-cyan-400 transition-colors duration-300">
                              {nft.name}
                            </h3>
                            <p className="text-gray-400 text-sm truncate mb-3">
                              {nft.description}
                            </p>
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-xs text-gray-400">
                                  Price
                                </div>
                                <div className="text-cyan-400 font-medium">
                                  {nft.price ? `${nft.price} OG` : "--"}
                                </div>
                                {nft.floorPrice > 0 && (
                                  <div className="text-xs text-gray-400 mt-1">
                                    Floor: {nft.floorPrice} OG
                                  </div>
                                )}
                              </div>
                              <div
                                className={`text-xs px-2 py-1 rounded-lg ${
                                  nft.isListed
                                    ? "bg-green-900/30 text-green-400"
                                    : "bg-gray-800 text-gray-400"
                                }`}
                              >
                                {nft.isListed ? "Listed" : "Not listed"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>

                  {hasMore && (
                    <div className="mt-12 text-center">
                      <button
                        onClick={loadMore}
                        className="relative bg-gradient-to-r from-cyan-600 to-blue-700 text-white px-8 py-3 rounded-xl font-bold hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-900/30 group cursor-pointer"
                      >
                        <span className="flex items-center">
                          Load More
                          <svg
                            className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            ></path>
                          </svg>
                        </span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🖼️</div>
                  <h3 className="text-xl font-bold mb-2">No NFTs Found</h3>
                  <p className="text-gray-400 mb-6">
                    {state.searchQuery
                      ? `No results for "${state.searchQuery}"`
                      : "There are currently no NFTs matching your filters"}
                  </p>
                  <button
                    onClick={resetFilters}
                    className="inline-block px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
                  >
                    Reset Filters
                  </button>
                  <p className="mt-4 text-sm text-gray-500">
                    or try adjusting your search criteria
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Collections Banner */}
      {collections.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">
                  Top Collections on 0G Chain
                </h2>
                <p className="mt-2 text-gray-400 max-w-xl">
                  Explore the most popular NFT collections powered by 0G&apos;s
                  high-performance blockchain
                </p>
              </div>
              <Link
                href="/collections"
                className="mt-6 md:mt-0 bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 hover:border-cyan-500/50 px-6 py-3 rounded-xl transition-all duration-300 cursor-pointer"
              >
                View All Collections
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {collections.map((collection, index) => (
                <Link
                  key={collection._id || index}
                  className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                  href={`/collection/${collection._id || collection.id}`}
                >
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800">
                      {collection.previewImage ? (
                        <Image
                          src={collection.previewImage}
                          alt={collection.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-cyan-400">
                          <i className="fas fa-layer-group text-2xl"></i>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="font-bold text-lg">{collection.name}</h3>
                      <div className="flex items-center mt-1">
                        <div className="text-cyan-400 text-sm">
                          Floor: {collection.stats?.floorPrice || "--"} OG
                        </div>
                        <div className="w-1 h-1 bg-gray-500 rounded-full mx-2"></div>
                        <div className="text-gray-400 text-sm">
                          {collection.stats?.totalItems || "--"} items
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 0G Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Why Trade NFTs on 0G Chain?
            </h2>
            <p className="mt-4 text-xl text-gray-400 max-w-3xl mx-auto">
              Experience the next generation of NFT trading
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1">
              <div className="text-cyan-400 text-2xl font-bold mb-2">
                $0.001
              </div>
              <h3 className="text-xl font-bold text-white">Ultra-Low Fees</h3>
              <p className="mt-3 text-gray-400">
                Trade NFTs with minimal transaction costs thanks to 0G&apos;s
                efficient architecture.
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1">
              <div className="text-cyan-400 text-2xl font-bold mb-2">2s</div>
              <h3 className="text-xl font-bold text-white">Instant Trades</h3>
              <p className="mt-3 text-gray-400">
                Near-instant transaction finality ensures your NFT trades
                complete in seconds.
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:-translate-y-1">
              <div className="text-cyan-400 text-2xl font-bold mb-2">
                50K+ TPS
              </div>
              <h3 className="text-xl font-bold text-white">
                Massive Scalability
              </h3>
              <p className="mt-3 text-gray-400">
                Built to handle thousands of transactions per second without
                congestion.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ExplorePage;
