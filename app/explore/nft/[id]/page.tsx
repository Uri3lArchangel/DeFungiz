"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import dynamic from "next/dynamic";
import AuctionModal from "@/components/AuctionModal";
import { purchaseNFT } from "@/utils/purchaseNFT";

// Dynamically import 3D viewer only when needed
const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
});

interface Attribute {
  trait: string;
  value: string;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  stats?: {
    floorPrice?: number;
  };
}

interface NFT {
  _id: string;
  id: string;
  tokenId: string;
  name: string;
  description: string;
  assetType: "image" | "video" | "audio" | "3d" | "other";
  assetUrl: string;
  previewUrl: string;
  price: string;
  owner: string;
  creator: string;
  collection?: Collection;
  attributes: Attribute[];
  isListed: boolean;
  isAuction: boolean;
  auctionEnd?: string;
  bids?: any[];
  history?: any[];
  royalty: number;
}

const NFTDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { isConnected, account } = useWallet();
  const [nft, setNFT] = useState<NFT | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [isStartingAuction, setIsStartingAuction] = useState(false);
  const [isAuctionModalOpen, setIsAuctionModalOpen] = useState(false);

  useEffect(() => {
    console.log({ account });
    const fetchNFT = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/nfts/${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("NFT not found");
          }
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Failed to load NFT");
        }

        setNFT(data.data);
      } catch (error) {
        console.error("Error fetching NFT:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFT();
  }, [id, account]);

  const handleBuyNFT = async () => {
    if (!isConnected || !account) {
      alert("Please connect your wallet to purchase this NFT");
      return;
    }

    if (!nft) return;

    setIsBuying(true);
    try {
      if (isNaN(Number(nft.price))) {
        return;
      }
      const result = await purchaseNFT(
        nft._id.toString(),
        Number(nft.price),
        nft.owner,
        nft.creator,
        nft.royalty
      );

      router.push(`/profile`);
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Purchase failed. Please try again.");
    } finally {
      setIsBuying(false);
    }
  };

  const handleStartAuction = async (settings: {
    startingPrice: string;
    reservePrice: string;
    duration: string;
  }) => {
    if (!isConnected || !account || !nft) return;

    setIsStartingAuction(true);
    try {
      const response = await fetch("/api/nfts/auction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nftId: nft.id,
          seller: account,
          startingPrice: settings.startingPrice,
          reservePrice: settings.reservePrice,
          duration: settings.duration,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start auction");
      }

      const tx = await response.json();
      alert(`Auction started successfully! Transaction hash: ${tx.hash}`);
      setIsAuctionModalOpen(false);
      // Refresh NFT data
      const nftResponse = await fetch(`/api/nfts/${id}`);
      setNFT(await nftResponse.json());
    } catch (error) {
      console.error("Auction error:", error);
      alert("Failed to start auction. Please try again.");
    } finally {
      setIsStartingAuction(false);
    }
  };

  const handleCancelListing = async () => {
    if (!isConnected || !account || !nft) return;

    const confirmed = confirm("Are you sure you want to cancel this listing?");
    if (!confirmed) return;

    try {
      const response = await fetch("/api/nfts/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nftId: nft.id,
          owner: account,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel listing");
      }

      const tx = await response.json();
      alert(`Listing canceled successfully! Transaction hash: ${tx.hash}`);
      // Refresh NFT data
      const nftResponse = await fetch(`/api/nfts/${id}`);
      setNFT(await nftResponse.json());
    } catch (error) {
      console.error("Cancel error:", error);
      alert("Failed to cancel listing. Please try again.");
    }
  };

  const handlePlaceBid = async () => {
    if (!isConnected || !account || !nft) return;

    const bidAmount = prompt("Enter your bid amount (OG):");
    if (!bidAmount || isNaN(Number(bidAmount))) {
      alert("Please enter a valid bid amount");
      return;
    }

    try {
      const response = await fetch("/api/nfts/bid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nftId: nft.id,
          bidder: account,
          amount: bidAmount,
        }),
      });

      if (!response.ok) {
        throw new Error("Bid failed");
      }

      const tx = await response.json();
      alert(`Bid placed successfully! Transaction hash: ${tx.hash}`);
      // Refresh NFT data
      const nftResponse = await fetch(`/api/nfts/${id}`);
      setNFT(await nftResponse.json());
    } catch (error) {
      console.error("Bid error:", error);
      alert("Bid failed. Please try again.");
    }
  };

  const handleSettleAuction = async () => {
    if (!isConnected || !account || !nft) return;

    try {
      const response = await fetch("/api/nfts/settle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nftId: nft.id,
          caller: account,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to settle auction");
      }

      const tx = await response.json();
      alert(`Auction settled successfully! Transaction hash: ${tx.hash}`);
      // Refresh NFT data
      const nftResponse = await fetch(`/api/nfts/${id}`);
      setNFT(await nftResponse.json());
    } catch (error) {
      console.error("Settle error:", error);
      alert("Failed to settle auction. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-[#0a0f1f] text-white">
        <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-1/2">
              <div className="bg-gray-900/50 border border-cyan-900/30 rounded-2xl h-[500px] animate-pulse"></div>
            </div>
            <div className="lg:w-1/2 space-y-6">
              <div className="h-10 bg-gray-800/50 rounded animate-pulse w-3/4"></div>
              <div className="h-6 bg-gray-800/50 rounded animate-pulse w-full"></div>
              <div className="h-6 bg-gray-800/50 rounded animate-pulse w-2/3"></div>
              <div className="h-40 bg-gray-800/50 rounded-xl animate-pulse mt-8"></div>
              <div className="h-14 bg-gray-800/50 rounded-lg animate-pulse w-full mt-8"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !nft) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-[#0a0f1f] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold">NFT Not Found</h2>
          <p className="mt-4 text-gray-400">
            {error ||
              "The NFT you're looking for doesn't exist or has been removed"}
          </p>
          <button
            onClick={() => router.push("/explore")}
            className="mt-6 bg-cyan-600 hover:bg-cyan-500 px-6 py-3 rounded-xl transition-all duration-300 cursor-pointer"
          >
            Browse NFTs
          </button>
        </div>
      </div>
    );
  }

  const isOwner =
    isConnected && account?.toLowerCase() === nft.owner.toLowerCase();
  const isCreator =
    isConnected && account?.toLowerCase() === nft.creator.toLowerCase();
  const canStartAuction = isOwner && nft.isListed && !nft.isAuction;
  const canPlaceBid = isConnected && !isOwner && nft.isAuction;
  const canSettleAuction =
    isOwner && nft.isAuction && new Date(nft.auctionEnd || "") < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-[#0a0f1f] text-white">
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* NFT Media */}
          <div className="lg:w-1/2">
            <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-cyan-900/50 rounded-2xl overflow-hidden">
              {nft.assetType === "image" && (
                <img
                  src={nft.assetUrl}
                  alt={nft.name}
                  className="w-full h-[500px] object-contain"
                  loading="lazy"
                />
              )}

              {nft.assetType === "video" && (
                <video
                  controls
                  className="w-full h-[500px] object-contain"
                  poster={nft.previewUrl}
                >
                  <source src={nft.assetUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}

              {nft.assetType === "audio" && (
                <div className="h-[500px] flex flex-col items-center justify-center bg-gradient-to-tr from-cyan-700/10 to-purple-700/10">
                  <img
                    src={nft.previewUrl}
                    alt={nft.name}
                    className="w-64 h-64 rounded-lg object-cover mb-6"
                  />
                  <audio controls className="w-full max-w-md">
                    <source src={nft.assetUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {nft.assetType === "3d" && (
                <div className="h-[500px]">
                  <ModelViewer src={nft.assetUrl} />
                </div>
              )}

              {nft.assetType === "other" && (
                <div className="h-[500px] flex items-center justify-center bg-gradient-to-tr from-cyan-700/10 to-purple-700/10">
                  <div className="bg-gray-800/50 rounded-full w-32 h-32 flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-cyan-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path>
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* NFT Details */}
          <div className="lg:w-1/2">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl md:text-4xl font-bold">{nft.name}</h1>
              <div className="bg-gradient-to-r from-cyan-600/80 to-blue-700/80 text-white text-sm px-3 py-1 rounded-lg">
                #{nft.tokenId}
              </div>
            </div>

            {nft.collection && (
              <div
                onClick={() =>
                  router.push(`/explore/collection/${nft.collection!.id}`)
                }
                className="mt-2 text-cyan-500 hover:text-cyan-400 cursor-pointer flex items-center"
              >
                {nft.collection.name}
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  ></path>
                </svg>
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Description</h2>
              <p className="text-gray-400">{nft.description}</p>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Attributes</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {nft.attributes.map((attr, index) => (
                  <div
                    key={index}
                    className="bg-gray-900/50 border border-cyan-900/30 rounded-xl p-3"
                  >
                    <div className="text-xs text-gray-400">{attr.trait}</div>
                    <div className="font-medium mt-1">{attr.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 bg-gray-900/50 border border-cyan-900/30 rounded-2xl p-6">
              {nft.isAuction ? (
                <>
                  <h2 className="text-xl font-bold mb-2">Auction Details</h2>
                  <div className="text-cyan-400 text-lg font-bold mb-4">
                    Current Bid: {nft.price} OG
                  </div>
                  {nft.auctionEnd && (
                    <div className="text-gray-400 mb-4">
                      Ends: {new Date(nft.auctionEnd).toLocaleString()}
                    </div>
                  )}

                  {canPlaceBid && (
                    <button
                      onClick={handlePlaceBid}
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 py-4 rounded-xl font-bold transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer mb-4"
                    >
                      Place Bid
                    </button>
                  )}

                  {canSettleAuction && (
                    <button
                      onClick={handleSettleAuction}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 py-4 rounded-xl font-bold transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
                    >
                      Settle Auction
                    </button>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold mb-4">Price</h2>
                  <div className="text-3xl font-bold text-cyan-400">
                    {nft.price} OG
                  </div>

                  {isConnected ? (
                    <>
                      <div className="mt-6 space-y-4">
                        {canStartAuction && (
                          <button
                            onClick={() => setIsAuctionModalOpen(true)}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 py-4 rounded-xl font-bold transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
                          >
                            Start Auction
                          </button>
                        )}
                      </div>

                      {nft.history &&
                      nft.history.length > 0 &&
                      nft.owner == account ? (
                        nft.isListed ? null : (
                          <button
                            // onClick={handleListNFT}
                            className={`w-full py-4 rounded-xl font-bold transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer mt-6 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 `}
                          >
                            List NFT
                          </button>
                        )
                      )  : (
                        <button
                          onClick={handleBuyNFT}
                          disabled={isBuying}
                          className={`w-full py-4 rounded-xl font-bold transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer mt-6 ${
                            isBuying
                              ? "bg-gray-700 cursor-not-allowed"
                              : "bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600"
                          }`}
                        >
                          {isBuying ? "Processing Purchase..." : "Buy Now"}
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => router.push("/")}
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 py-4 rounded-xl font-bold transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer mt-6"
                    >
                      Connect Wallet to {isOwner ? "Manage" : "Purchase"}
                    </button>
                  )}
                </>
              )}

              <div className="mt-6 text-sm text-gray-400">
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span>Owner</span>
                  <span
                    className="text-cyan-400 hover:underline cursor-pointer"
                    onClick={() => router.push(`/profile/${nft.owner}`)}
                  >
                    {nft.owner.substring(0, 6)}...
                    {nft.owner.substring(nft.owner.length - 4)}
                    {isOwner && " (You)"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span>Creator</span>
                  <span
                    className="text-cyan-400 hover:underline cursor-pointer"
                    onClick={() => router.push(`/profile/${nft.creator}`)}
                  >
                    {nft.creator.substring(0, 6)}...
                    {nft.creator.substring(nft.creator.length - 4)}
                    {isCreator && " (You)"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Royalty</span>
                  <span className="text-cyan-400">{nft.royalty}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auction Modal */}
      <AuctionModal
        isOpen={isAuctionModalOpen}
        onClose={() => setIsAuctionModalOpen(false)}
        onSubmit={handleStartAuction}
        isSubmitting={isStartingAuction}
      />
    </div>
  );
};

export default NFTDetailPage;
