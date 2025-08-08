// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";


contract DeFungizMarketplace is ReentrancyGuard, Ownable, ERC721Holder {

    using Counters for Counters.Counter;
    Counters.Counter private _listingIds;
    Counters.Counter private _auctionIds;
  


    //Constants 
    uint256 public PLATFORM_LISTING_FEE_PERCENT = 1000;
    uint256 public PLATFORM_AUCTION_FEE_PERCENT = 1000;
     // Minimum auction duration (in seconds)
    uint256 public minAuctionDuration = 1 hours;
    // Maximum auction duration (in seconds)
    uint256 public maxAuctionDuration = 4 days;
    

    

    // Listing struct
    struct Listing {
        uint256 listingId;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
        address buyer;
    }

    
    // Auction struct
    struct Auction {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 startingPrice;
        uint256 currentBid;
        address currentBidder;
        uint256 endTime;
        bool isActive;
        uint256 auctionId;
        uint256 createdAt;
        uint256 updatedAt; 
    }

   

    // Mapping to store listings
    mapping(uint256 => Listing) public listings;
    mapping(address => uint256[]) public listingsBySeller;

    //Mapping to store offers and auction
    mapping(uint256 => Auction) public auctions;
 

    uint256 public auctionCount;

     
    

    // Mapping from NFT contract + token ID to listing ID
    mapping(address => mapping(uint256 => uint256)) public nftToListingId;
    //Mapping from NFT contract + tokenId to auctionId
    mapping(address => mapping(uint256 => uint256)) public nftToAuctionId;
 

    // Events
    event ListingCreated(uint256 listingId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 price);
    event ListingUpdated(uint256 listingId, uint256 newPrice);
    event ListingPurchased(uint256 listingId, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 listingId);

    
    event AuctionCreated(uint256 indexed auctionId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 startingPrice, uint256 endTime);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 finalBid);
    event AuctionCancelled(uint256 indexed auctionId);
    event PlatformFeeListingUpdated(uint256 newFee);
    event PlatformFeeAuctionUpdated(uint256 newFee);
    event FeesWithdrawn(uint256 amount);
    // Modifiers
    // check if listing exists
    modifier listingExistsAndActive(uint256 listingId){
        require(listings[listingId].isActive, 'NFT either does not existed or has not been listed');
        _;
    }
    
    modifier onlySeller(uint256 listingId) {
        require(listings[listingId].seller == msg.sender, 'Only the seller of the NFT can change the price');
        _;
    }

    modifier notSeller(uint256 listingId) {
        require(listings[listingId].seller != msg.sender, 'The seller cannot purchase the NFT');
        _;
    }


    
    modifier auctionExists(uint256 auctionId) {
        require(auctions[auctionId].isActive, "Auction does not exist or is not active");
        _;
    }

    
    modifier onlyAuctionSeller(uint256 auctionId) {
        require(auctions[auctionId].seller == msg.sender, "Only auction seller can perform this action");
        _;
    }


   // ============ LISTING FUNCTIONS ============

    /**
     * @dev Create a new listing for an NFT
     * @param nftContract Address of the NFT contract
     * @param tokenId ID of the NFT token
     * @param price Price in wei
     */
    function createListing(uint256 tokenId, address nftContract, uint256 price) external nonReentrant {
        // Make sure the price is not lesser than 0
        require(price >= 0, 'Price must be greater or equal to 0');

        //check if the person owns the NFT to list it
        require(ERC721(nftContract).ownerOf(tokenId) == msg.sender, 'You cannot list NFT that you do not own');

        require(
        IERC721(nftContract).isApprovedForAll(msg.sender, address(this)),
        "NFT must be approved for marketplace"
        );

        // Transfer NFT to contract
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);


        // Create the listing
        _listingIds.increment();

        uint256 listingId = _listingIds.current();

        // Create the listing struct
        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            buyer: address(0)
        });

        nftToListingId[nftContract][tokenId] = listingId;
        listingsBySeller[msg.sender].push(listingId);
        emit ListingCreated(listingId, msg.sender, nftContract, tokenId, price);
    }
    
    /**
     * @dev Update a listing for an NFT
     * @param listingId ID of the listing
     * @param newPrice New price in wei
     */
    function updateListing(uint256 listingId, uint256 newPrice) external listingExistsAndActive(listingId) onlySeller(listingId) {

        // Make sure the price is not lesser than 0
        require(newPrice >= 0, 'Price must be greater or equal to 0');

        Listing storage listing = listings[listingId];

        listing.price = newPrice;
        listing.updatedAt = block.timestamp;

         emit ListingUpdated(listingId, newPrice);
    }




    
    /**
     * @dev Buy an NFT from a listing
     * @param listingId ID of the listing to buy from
     */
    function buyNFT(uint256 listingId) external payable nonReentrant listingExistsAndActive(listingId) notSeller(listingId){
        Listing storage listing = listings[listingId];

        require(msg.value == listing.price, "Incorrect payment amount");

        uint256 PLATFORM_FEE = (PLATFORM_LISTING_FEE_PERCENT * listing.price) / 10000;
        uint256 sellerAmount = listing.price - PLATFORM_FEE;
        
        // Transfer NFT to buyer
        IERC721(listing.nftContract).safeTransferFrom(
            address(this),
            msg.sender,
            listing.tokenId
        );

        // Transfer payment to seller
        payable(listing.seller).transfer(sellerAmount);

        // Platform fee stays in contract for later withdrawal
        // payable(owner()).transfer(PLATFORM_FEE);
        
        listing.isActive = false;
        listing.updatedAt = block.timestamp;
        listing.buyer = msg.sender;

        // Remove from listingsBySeller mapping
        uint256[] storage userListings = listingsBySeller[listing.seller];
        for (uint256 i = 0; i < userListings.length; i++) {
            if (userListings[i] == listingId) {
                userListings[i] = userListings[userListings.length - 1];
                userListings.pop();
                break;
            }
        }

        delete nftToListingId[listing.nftContract][listing.tokenId];
        emit ListingPurchased(listingId, msg.sender, msg.value);
    }


    /**
     * @dev Cancel a Listing for an NFT
     * @param listingId The id of the listing to be cancelled
     */
    function cancelListing(uint256 listingId) external nonReentrant listingExistsAndActive(listingId) onlySeller(listingId) {
        Listing storage listing = listings[listingId];

        listing.isActive = false;
        listing.updatedAt = block.timestamp;
        listing.buyer = address(0);

        // Transfer NFT to seller
        IERC721(listing.nftContract).safeTransferFrom(
            address(this),
            listing.seller,
            listing.tokenId
        );

        // Remove from listingsBySeller mapping
        uint256[] storage userListings = listingsBySeller[listing.seller];
        for (uint256 i = 0; i < userListings.length; i++) {
            if (userListings[i] == listingId) {
                userListings[i] = userListings[userListings.length - 1];
                userListings.pop();
                break;
            }
        }

        delete nftToListingId[listing.nftContract][listing.tokenId];
        emit ListingCancelled(listingId);
    }



    // ============ AUCTION FUNCTIONS ============

   

    /**
     * @dev Create an auction for an NFT
     * @param nftContract Address of the NFT contract
     * @param tokenId ID of the NFT token
     * @param startingPrice Starting price in wei
     * @param duration Duration of the auction in seconds
     */
    function createAuction(address nftContract, uint256 tokenId, uint256 startingPrice, uint256 duration) external nonReentrant {
        // Make sure the price is not lesser than 0
        require(startingPrice >= 0, 'Price must be greater or equal to 0');
        //check if the person owns the NFT to list it
        require(ERC721(nftContract).ownerOf(tokenId) == msg.sender, 'You cannot mint NFT that you do not own');
        //check duration
        require(duration >= minAuctionDuration, 'Duration time too short, it must be greater than or equal to 2 minutes');
        require(duration <= maxAuctionDuration, 'Duration time too long, it must be less than or equal to 4 days');

        //Check for approval for transfer
        require(
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)),
            "NFT must be approved for marketplace"
        );

        //check if the NFT has already been auctioned
        require(
            nftToAuctionId[nftContract][tokenId] == 0,
            "NFT is already in an auction"
        );

        // Transfer NFT to contract
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);

        _auctionIds.increment();
        uint256 auctionId = _auctionIds.current();
        auctions[auctionId] = Auction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            startingPrice: startingPrice,
            currentBid: 0,
            currentBidder: address(0),
            endTime: block.timestamp + duration,
            isActive: true,
            auctionId: auctionId,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        nftToAuctionId[nftContract][tokenId] = auctionId;

        emit AuctionCreated(auctionId, msg.sender, nftContract, tokenId, startingPrice, block.timestamp + duration);
    }

     /**
     * @dev Place a bid on an auction
     * @param auctionId ID of the auction to bid on
     */
    function placeBid(uint256 auctionId) external payable auctionExists(auctionId) nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(block.timestamp < auction.endTime, "Auction has ended");
        require(msg.sender != auction.seller, "Seller cannot bid on their own auction");
        require(msg.value > auction.currentBid, "Bid must be higher than current bid");
        require(msg.value >= auction.startingPrice, "Bid must be at least the starting price");
        
        // Refund previous bidder if there is one
        if (auction.currentBidder != address(0)) {
            payable(auction.currentBidder).transfer(auction.currentBid);
        }
        
        auction.currentBid = msg.value;
        auction.currentBidder = msg.sender;
        auction.updatedAt = block.timestamp;
        
        emit BidPlaced(auctionId, msg.sender, msg.value);
    }
    
    /**
     * @dev End an auction and transfer NFT to winner
     * @param auctionId ID of the auction to end
     */
    function endAuction(uint256 auctionId) external auctionExists(auctionId) nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(block.timestamp >= auction.endTime, "Auction has not ended yet");
        
        auction.isActive = false;
        delete nftToAuctionId[auction.nftContract][auction.tokenId];
        
        if (auction.currentBidder != address(0)) {
            // Transfer NFT to winner
            IERC721(auction.nftContract).safeTransferFrom(
                address(this),
                auction.currentBidder,
                auction.tokenId
            );
            
            // Calculate fees
            uint256 PLATFORM_FEE = (auction.currentBid * PLATFORM_AUCTION_FEE_PERCENT) / 10000;
            uint256 sellerAmount = auction.currentBid - PLATFORM_FEE;
            
            // Transfer payment to seller
            payable(auction.seller).transfer(sellerAmount);
            
            // Platform fee stays in contract for later withdrawal
            // payable(owner()).transfer(PLATFORM_FEE);
            
            emit AuctionEnded(auctionId, auction.currentBidder, auction.currentBid);
        } else {
            // No bids, return NFT to seller
            IERC721(auction.nftContract).safeTransferFrom(address(this), auction.seller, auction.tokenId);
            emit AuctionEnded(auctionId, address(0), 0);
        }
    }
    
    /**
     * @dev Cancel an auction (only seller can do this before any bids)
     * @param auctionId ID of the auction to cancel
     */
    function cancelAuction(uint256 auctionId) external auctionExists(auctionId) onlyAuctionSeller(auctionId) nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.currentBidder == address(0), "Cannot cancel auction with bids");
        
        // Return NFT to seller
        IERC721(auction.nftContract).safeTransferFrom(
            address(this),
            auction.seller,
            auction.tokenId
        );
        
        auction.isActive = false;
        auction.updatedAt = block.timestamp;
        delete nftToAuctionId[auction.nftContract][auction.tokenId];
        
        emit AuctionCancelled(auctionId);
    }




    //  view functions
 /**
     * @dev Get listing details
     * @param listingId ID of the listing
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    /**
     * @dev Get all listings for a user
     * @param user Address of the user
     */
    function getUserListings(address user) external view returns (uint256[] memory) {
        return listingsBySeller[user];
    }

    /**
     * @dev Get total number of listings
     */
    function getTotalListings() external view returns (uint256) {
        return _listingIds.current();
    }

    /**
     * @dev Get active listings
     */
    function getActiveListings() external view returns (uint256[] memory) {
        uint256 totalListings = _listingIds.current();
        uint256[] memory tempListings = new uint256[](totalListings);
        uint256 count = 0;

        for (uint256 i = 1; i <= totalListings; i++) {
            if (listings[i].isActive) {
                tempListings[count] = i;
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = tempListings[i];
        }

        return result;
    }

    function getAuction(uint256 auctionId) external view returns (Auction memory) {
        return auctions[auctionId];
    }

    function getTotalAuctions() external view returns (uint256) {
        return _auctionIds.current();
    }

    function updateAuctionFee(uint256 newFee) external onlyOwner {
    require(newFee <= 1000, "Auction fee cannot exceed 10%");
    PLATFORM_AUCTION_FEE_PERCENT = newFee;
    emit PlatformFeeAuctionUpdated(newFee); // Optionally emit a separate event
}

    
    


    /**
     * @dev Update platform fee (only owner)
     * @param newFee New platform fee in basis points
     */
    function updatePlatformListtingFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Platform fee cannot exceed 10%");
        PLATFORM_LISTING_FEE_PERCENT = newFee;
        emit PlatformFeeListingUpdated(newFee);
    }

    /**
     * @dev Withdraw platform fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
        emit FeesWithdrawn(balance);
    }

    /**
     * @dev Emergency function to withdraw stuck NFTs (only owner)
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID
     * @param recipient Address to send the NFT to
     */
    function emergencyWithdrawNFT(address nftContract, uint256 tokenId, address recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        
        // Try ERC721 first
        try IERC721(nftContract).ownerOf(tokenId) returns (address owner) {
            if (owner == address(this)) {
                IERC721(nftContract).safeTransferFrom(address(this), recipient, tokenId);
            }
        } catch {
            // If ERC721 fails, try ERC1155
            uint256 balance = IERC1155(nftContract).balanceOf(address(this), tokenId);
            if (balance > 0) {
                IERC1155(nftContract).safeTransferFrom(address(this), recipient, tokenId, balance, "");
            }
        }
    }

}