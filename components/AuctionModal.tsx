"use client";

import React, { useState } from "react";

interface AuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (settings: {
    startingPrice: string;
    reservePrice: string;
    duration: string;
  }) => void;
  isSubmitting: boolean;
}

const AuctionModal: React.FC<AuctionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [auctionSettings, setAuctionSettings] = useState({
    startingPrice: "",
    reservePrice: "",
    duration: "24", // hours
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(auctionSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md overflow-hidden shadow-2xl shadow-cyan-900/20">
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-800">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Start Auction
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-800"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Starting Price (OG)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={auctionSettings.startingPrice}
                  onChange={(e) =>
                    setAuctionSettings({
                      ...auctionSettings,
                      startingPrice: e.target.value,
                    })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/30 transition-all"
                  placeholder="0.1"
                  min="0"
                  step="0.01"
                  required
                />
                <span className="absolute right-3 top-3 text-gray-400">OG</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reserve Price (OG)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={auctionSettings.reservePrice}
                  onChange={(e) =>
                    setAuctionSettings({
                      ...auctionSettings,
                      reservePrice: e.target.value,
                    })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/30 transition-all"
                  placeholder="0.5"
                  min="0"
                  step="0.01"
                  required
                />
                <span className="absolute right-3 top-3 text-gray-400">OG</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration
              </label>
              <div className="relative">
                <select
                  value={auctionSettings.duration}
                  onChange={(e) =>
                    setAuctionSettings({
                      ...auctionSettings,
                      duration: e.target.value,
                    })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/30 appearance-none"
                  required
                >
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours</option>
                  <option value="168">7 days</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium transition-all duration-200 shadow-lg shadow-cyan-500/20 ${
                isSubmitting
                  ? "opacity-80 cursor-not-allowed"
                  : "hover:shadow-cyan-500/30"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Starting Auction
                </span>
              ) : (
                "Start Auction"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuctionModal;