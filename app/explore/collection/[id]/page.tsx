'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { isValidObjectId } from '@/utils/validateObjectId';
import Image from 'next/image';
interface NFT {
  _id: string;
  name: string;
  description?: string;
  assetUrl: string;
  previewUrl: string;
  assetType: string;
  price: number;
  isListed: boolean;
  creator: string;
  owner: string;
}

interface Collection {
  _id: string;
  name: string;
  description: string;
  previewImage: string;
  creator: string;
  nfts: NFT[];
  floorPrice: number;
  stats?: {
    totalItems: number;
    totalOwners: number;
    floorPrice: number;
    volumeTraded: number;
  };
}

const CollectionDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch collection data
  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Validate ObjectID format
        if (!isValidObjectId(id as string)) {
          throw new Error('Invalid collection ID format');
        }

        const response = await fetch(`/api/collections/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch collection');
        }

        setCollection(data.data);
      } catch (error) {
        console.error('Error fetching collection:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollection();

  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-[#0a0f1f] text-white">
        <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-1/3">
              <div className="bg-gray-900/50 border border-cyan-900/30 rounded-2xl h-80 animate-pulse"></div>
            </div>
            <div className="lg:w-2/3 space-y-6">
              <div className="h-10 bg-gray-800/50 rounded animate-pulse w-1/2"></div>
              <div className="h-6 bg-gray-800/50 rounded animate-pulse w-full"></div>
              <div className="h-6 bg-gray-800/50 rounded animate-pulse w-3/4"></div>
              <div className="grid grid-cols-4 gap-4 mt-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 bg-gray-800/50 rounded-xl animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-16">
            <div className="h-10 bg-gray-800/50 rounded animate-pulse w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-gray-900/50 border border-cyan-900/30 rounded-2xl h-72 animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-[#0a0f1f] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Error Loading Collection</h2>
          <p className="mt-4 text-gray-400">{error}</p>
          <button 
            onClick={() => router.push('/collections')}
            className="mt-6 bg-cyan-600 hover:bg-cyan-500 px-6 py-3 rounded-xl transition-all duration-300 cursor-pointer"
          >
            Browse Collections
          </button>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-[#0a0f1f] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Collection Not Found</h2>
          <p className="mt-4 text-gray-400">The collection you&apos;re looking for doesn&apos;t exist or has been removed</p>
          <button 
            onClick={() => router.push('/collections')}
            className="mt-6 bg-cyan-600 hover:bg-cyan-500 px-6 py-3 rounded-xl transition-all duration-300 cursor-pointer"
          >
            Browse Collections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-[#0a0f1f] text-white">
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        {/* Collection Header */}
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-1/3">
            <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-cyan-900/50 rounded-2xl overflow-hidden">
              <div className="h-80 flex items-center justify-center">
                <Image 
                  src={collection.previewImage} 
                  alt={collection.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-collection.png';
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="lg:w-2/3">
            <h1 className="text-3xl md:text-4xl font-bold">{collection.name}</h1>
            
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-4">Description</h2>
              <p className="text-gray-400">{collection.description || 'No description provided'}</p>
            </div>
            
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900/50 border border-cyan-900/30 rounded-xl p-4">
                <div className="text-gray-400">Items</div>
                <div className="text-xl font-bold mt-1">{collection.nfts?.length || 0}</div>
              </div>
              <div className="bg-gray-900/50 border border-cyan-900/30 rounded-xl p-4">
                <div className="text-gray-400">Floor</div>
                <div className="text-xl font-bold text-cyan-400 mt-1">
                  {collection.stats!.floorPrice?.toFixed(2) || '0.00'} OG
                </div>
              </div>
              <div className="bg-gray-900/50 border border-cyan-900/30 rounded-xl p-4">
                <div className="text-gray-400">Volume</div>
                <div className="text-xl font-bold mt-1">
                  {collection.stats?.volumeTraded?.toFixed(2) || '0.00'} OG
                </div>
              </div>
              <div className="bg-gray-900/50 border border-cyan-900/30 rounded-xl p-4">
                <div className="text-gray-400">Blockchain</div>
                <div className="text-xl font-bold text-cyan-400 mt-1">0G Chain</div>
              </div>
            </div>
            
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Creator</h2>
              <div className="flex items-center">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12" />
                <div className="ml-3">
                  <div className="font-medium">
                    {collection.creator.substring(0, 6)}...{collection.creator.substring(collection.creator.length - 4)}
                  </div>
                  <div className="text-sm text-cyan-400">Verified Creator</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Collection NFTs */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8">NFTs in this Collection</h2>
          
          {collection.nfts?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {collection.nfts.map((nft) => (
                <div 
                  key={nft._id}
                  className="bg-gray-900/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-cyan-900/10 transition-all duration-300 group cursor-pointer"
                  onClick={() => router.push(`/explore/nft/${nft._id}`)}
                >
                  <div className="relative">
                    <div className="h-56 flex items-center justify-center bg-gradient-to-tr from-cyan-900/20 to-blue-900/20">
                      <Image 
                        src={nft.previewUrl || nft.assetUrl || '/default-nft.png'}
                        alt={nft.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-nft.png';
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-lg group-hover:text-cyan-400 transition-colors duration-300">
                      {nft.name}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                      {nft.description || 'No description'}
                    </p>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <div>
                        <div className="text-xs text-gray-400">Price</div>
                        <div className="text-cyan-400 font-medium">
                          {nft.price?.toFixed(2) || '0.00'} OG
                        </div>
                      </div>
                      <button 
                        className="bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/explore/nft/${nft._id}`);
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">No NFTs found in this collection</div>
              <button 
                className="mt-6 bg-cyan-600 hover:bg-cyan-500 px-6 py-3 rounded-xl transition-all duration-300 cursor-pointer"
                onClick={() => router.push('/create-nft')}
              >
                Create NFT
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionDetailPage;