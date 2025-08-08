// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;



import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract DeFungizNFTCollectionContract is ReentrancyGuard, Ownable, ERC1155, ERC1155URIStorage, AccessControl {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;
    using Strings for uint256;

    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant COLLECTION_MANAGER_ROLE = keccak256("COLLECTION_MANAGER_ROLE");
    uint256 public PLATFORM_FEE_PERCENTAGE = 500; // 5%

    // Counters
    Counters.Counter private _tokenIds;
    Counters.Counter private _collectionIds;

    // Collection structure
    struct Collection {
        uint256 id;
        string name;
        string description;
        string baseURI;
        uint256 currentSupply;
        bool isActive;
        address creator;
        uint256 createdAt;
    }


    struct NFTtokens {
        uint256 NFTId;
        uint256 collectionId;
        string tokenURI;
    }

    struct CollectionVoucher {
        address owner;
        string name;
        string description;
        string baseURI;
        uint256 amount;
        bytes signature;
        uint256 nonce;
    }
    
    // Storage
    mapping(uint256 => Collection) public collections;
    mapping(uint256 => uint256[]) public collectionNFTs;
    mapping(uint256 => uint256) public tokenToCollection;
    mapping(uint256 => NFTtokens) public singleNFTs;
    




    // Events
    event CollectionCreatedAndMinted(uint256 indexed collectionId, string name, address indexed to);
    event NFTMinted(uint256 indexed tokenId, address indexed to);
    event ERC1155Minted(uint256 indexed collectionId, address indexed to, uint256 amount);
    event CollectionUpdated(uint256 indexed collectionId, string name);
    event CollectionStatusToggled(uint256 indexed collectionId, bool isActive);

   
    // Modifiers
    modifier onlyCollectionManager() {
        require(hasRole(COLLECTION_MANAGER_ROLE, msg.sender) || owner() == msg.sender, "Not authorized to manage collections");
        _;
    }

    modifier collectionExists(uint256 collectionId) {
        require(collections[collectionId].id != 0, "Collection does not exist");
        _;
    }

    bytes32 private constant VOUCHER_TYPEHASH = keccak256(
         "CollectionVoucher(address owner,string name,string description,string baseURI,uint256 amount,uint256 nonce)"
    );

    mapping(bytes32 => bool) public usedVouchers;

    bytes32 private DOMAIN_SEPARATOR;

    constructor() ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COLLECTION_MANAGER_ROLE, msg.sender);
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("DeFungizNFTCollectionContract")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    function verify(CollectionVoucher calldata voucher) public view returns (bool) {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(
                    VOUCHER_TYPEHASH,
                    voucher.owner,
                    keccak256(bytes(voucher.name)),
                    keccak256(bytes(voucher.description)),
                    keccak256(bytes(voucher.baseURI)),
                    voucher.amount,
                    voucher.nonce
                ))
            )
            );

        address recoveredAddress = ECDSA.recover(digest, voucher.signature);
        return recoveredAddress == voucher.owner;
        }




     /**
     * @dev Create a new collection (ERC721 or ERC1155) - Public function for anyone to create collections
     * @param voucher Collection voucher with signature
     * @param to Address to mint to
     * @param tokenURIs Token metadata URIs
     * @param amount Amount to mint
     */
    function mintNFTCollection(CollectionVoucher calldata voucher, address to, string[] memory tokenURIs, uint256 amount ) external payable nonReentrant returns (uint256) {
        require(bytes(voucher.name).length > 0, "Name cannot be empty");
        require(tokenURIs.length > 0, "Token URIs cannot be empty");
        require(to != address(0), "Cannot mint 0 NFTs");

         // Check if the price is correct
        require(msg.value == voucher.amount, "Insufficient payment");

        // Check if the signature is valid
        require(verify(voucher), "Invalid signature");


        // Check if the voucher has already been used
        bytes32 voucherHash = keccak256(abi.encode(voucher.owner, voucher.name, voucher.description, voucher.baseURI, voucher.amount, voucher.nonce));
        require(!usedVouchers[voucherHash], "Voucher already used");
        usedVouchers[voucherHash] = true;


        _collectionIds.increment();
        uint256 newCollectionId = _collectionIds.current();
        uint256[] memory amounts = new uint256[](tokenURIs.length);
        uint256[] memory ids = new uint256[](tokenURIs.length);

        collections[newCollectionId] = Collection({
            id: newCollectionId,
            name: voucher.name,
            description: voucher.description,
            baseURI: voucher.baseURI,
            currentSupply: tokenURIs.length,
            isActive: true,
            creator: voucher.owner,
            createdAt: block.timestamp
        });

        // Iterate through tokenURIs and create NFTtokens


        for (uint256 i = 0; i < tokenURIs.length; i++) {
            _tokenIds.increment();
            uint256 tokenId = _tokenIds.current();
            amounts[i] = amount;
            ids[i] = tokenId;
            singleNFTs[tokenId] = NFTtokens({
                NFTId: tokenId,
                collectionId: newCollectionId,
                tokenURI: tokenURIs[i]
            });
            collectionNFTs[newCollectionId].push(tokenId);
            tokenToCollection[tokenId] = newCollectionId;
        }

        _mintBatch(to, ids, amounts, "");  
        _setURI(newCollectionId, voucher.baseURI);   

        // Calculate the amount of money to transfer to the creator
        uint256 PLATFORM_FEE = voucher.amount * PLATFORM_FEE_PERCENTAGE / 10000;

        (bool sent1, ) = payable(voucher.owner).call{value: voucher.amount - PLATFORM_FEE}("");
        require(sent1, "Payment to creator failed");

        (bool sent2, ) = payable(owner()).call{value: PLATFORM_FEE}("");
        require(sent2, "Payment to platform failed");


        emit CollectionCreatedAndMinted(newCollectionId, voucher.name, to);
        return newCollectionId;
    }

    // View Functions

    /**
     * @dev Get collection details
     * @param collectionId Collection ID
     */
    function getCollection(uint256 collectionId) external view returns (Collection memory) {
        return collections[collectionId];
    }

    /**
     * @dev Get collection ID for a token
     * @param tokenId Token ID
     */
    function getTokenCollection(uint256 tokenId) external view returns (uint256) {
        return tokenToCollection[tokenId];
    }

    /**
     * @dev Get total number of collections
     */
    function getTotalCollections() external view returns (uint256) {
        return _collectionIds.current();
    }

    /**
     * @dev Get all NFTs in a collection
     * @param collectionId Collection ID
     */
    function getCollectionNFTs(uint256 collectionId) external view returns (uint256[] memory) {
        return collectionNFTs[collectionId];
    }

    

    /**
     * @dev Get all collections
     */
    function getAllCollections() external view returns (Collection[] memory result) {
        uint256 total = _collectionIds.current();
        result = new Collection[](total);
        for (uint256 i = 1; i <= total; i++) {
            result[i - 1] = collections[i];
        }
        return result;
    }


    /**
     * @dev Get collections created by an address
     * @param creator Address of the creator
     */ 
    function getCollectionsByCreator(address creator) external view returns (uint256[] memory) {
        uint256 totalCollections = _collectionIds.current();
        uint256[] memory tempCollections = new uint256[](totalCollections);
        uint256 count = 0;

        for (uint256 i = 1; i <= totalCollections; i++) {
            if (collections[i].creator == creator) {
                tempCollections[count] = i;
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = tempCollections[i];
        }

        return result;
    }

  
    /**
     * @dev Grant collection manager role
     * @param account Address to grant role to
     */
    function grantCollectionManagerRole(address account) external onlyOwner {
        grantRole(COLLECTION_MANAGER_ROLE, account);
    }

    /**
     * @dev Revoke collection manager role
     * @param account Address to revoke role from
     */
    function revokeCollectionManagerRole(address account) external onlyOwner {
        revokeRole(COLLECTION_MANAGER_ROLE, account);
    }

    // Override functions to resolve conflicts
    function uri(uint256 tokenId) public view virtual override(ERC1155, ERC1155URIStorage) returns (string memory) {
        return super.uri(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}