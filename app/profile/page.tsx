"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/src/context/AppContext";
import Link from "next/link";
import Image from "next/image";

interface NFT {
  id: string;
  name: string;
  assetUrl: string;
  assetType: string;
  price?: number;
  collection?: {
    name: string;
    logo?: string;
  };
}

interface ProfileData {
  walletAddress: string;
  username: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  socialLinks: Record<string, string>;
  stats: {
    nftCount: number;
    collectionCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

const ProfilePage = () => {
  const { account, connectWallet } = useWallet();
  const router = useRouter();
  const { showNotification } = useAppContext();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!account) {
      connectWallet();
      return;
    }

    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/profile?address=${account}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setProfileData(data.profile);
        setNfts(data.nfts || []);
      } catch (error) {
        console.error("Profile data error:", error);
        showNotification(
          error instanceof Error ? error.message : "Failed to load profile data",
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [account]);

  const renderNFTs = () => {
    if (nfts.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-400">No NFTs found</p>
          <Link
            href="/create"
            className="mt-4 inline-block px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
          >
            Create your first NFT
          </Link>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {nfts.map((nft) => (
          <div
            key={nft.id}
            className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-cyan-500 transition-all duration-300 cursor-pointer group"
            onClick={() => router.push(`/explore/nft/${nft.id}`)}
          >
            <div className="aspect-square bg-gray-800 relative overflow-hidden">
              {nft.assetType === "image" ? (
                <Image
                  src={nft.assetUrl}
                  alt={nft.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <div className="text-cyan-400 text-5xl">
                    {nft.assetType === "video" && "🎥"}
                    {nft.assetType === "audio" && "🎵"}
                    {nft.assetType === "3d" && "🧊"}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg truncate">{nft.name}</h3>
              {nft.collection && (
                <p className="text-sm text-gray-400 truncate mt-1">
                  {nft.collection.name}
                </p>
              )}
              <div className="mt-3 flex justify-between items-center">
                <span className="text-cyan-400 font-medium">
                  {nft.price ? `${nft.price} ETH` : "Not listed"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          <p className="mt-4 text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <button
            onClick={() => (account ? window.location.reload() : connectWallet())}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
          >
            {account ? "Try Again" : "Connect Wallet"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12">
          <div className="w-24 h-24 rounded-full bg-gray-800 overflow-hidden border-2 border-cyan-500">
            {profileData.avatarUrl ? (
              <Image
                src={profileData.avatarUrl}
                alt="Profile"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900 text-3xl">
                👤
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <h1 className="text-3xl font-bold">{profileData.username}</h1>
            <p className="text-gray-400">{profileData.bio || "No bio yet"}</p>
            <div className="flex gap-4 text-sm">
              <span>
                <strong>{profileData.stats.nftCount}</strong> NFTs
              </span>
              <span>
                <strong>{profileData.stats.collectionCount}</strong> Collections
              </span>
           
            </div>
          </div>

          <button
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
            onClick={() => router.push("/create")}
          >
            Create NFT
          </button>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Your NFTs</h2>
          {renderNFTs()}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;