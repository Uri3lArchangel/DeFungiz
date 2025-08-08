// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract DeFungizNFTContract is ReentrancyGuard, Ownable, ERC721, ERC721URIStorage {
    using Counters for Counters.Counter;
    using ECDSA for bytes32;
    using Strings for uint256;

    // Counters
    Counters.Counter private _tokenIds;
    uint256 public PLATFORM_FEE_PERCENTAGE = 500; // 5%

    struct NFTtokens {
        uint256 NFTId;
        string tokenURI;
    }
   
    // Storage
    mapping(uint256 => NFTtokens) public singleNFTs;

    // Events
    event NFTMinted(uint256 indexed tokenId, address indexed to, uint256 price);
   

    struct NFTVoucher {
        string tokenURI;
        uint256 price;
        bytes signature;
        uint256 nonce;
        address owner;
    }

    bytes32 private constant VOUCHER_TYPEHASH = keccak256(
     "NFTVoucher(address owner,string tokenURI,uint256 price,uint256 nonce)"
    );

    mapping(bytes32 => bool) public usedVouchers;

    bytes32 private DOMAIN_SEPARATOR;

    constructor() ERC721("DeFungiz NFT", "DFNFT") {
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("DeFungizNFTContract")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    function verify(NFTVoucher calldata voucher) public view returns (bool) {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(
                    VOUCHER_TYPEHASH,
                    voucher.owner,
                    keccak256(bytes(voucher.tokenURI)),
                    voucher.price,
                    voucher.nonce
                ))
            )
            );

        address recoveredAddress = ECDSA.recover(digest, voucher.signature);
        return recoveredAddress == voucher.owner;
    }

    /**
     * @dev Mint a single NFT (ERC721) - Public function for anyone to mint
     * @param voucher NFT voucher with signature
     * @param to Address to mint to
     */
    function mintNFT(NFTVoucher calldata voucher, address to) external payable nonReentrant returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(voucher.tokenURI).length > 0, "Token URI cannot be empty");

        require(msg.value == voucher.price, "Insufficient payment");


        // Check if the signature is valid
        require(verify(voucher), "Invalid signature");

        // Check if the voucher has already been used
        bytes32 voucherHash = keccak256(abi.encode(voucher.owner, voucher.tokenURI, voucher.price, voucher.nonce));
        require(!usedVouchers[voucherHash], "Voucher already used");
        usedVouchers[voucherHash] = true;

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();   
        singleNFTs[newTokenId] = NFTtokens({
            NFTId: newTokenId,
            tokenURI: voucher.tokenURI
        });

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, voucher.tokenURI);
        


        // Calculate the amount of money to transfer to the owner
        uint256 PLATFORM_FEE = voucher.price * PLATFORM_FEE_PERCENTAGE / 10000;


        (bool sent1, ) = payable(voucher.owner).call{value: voucher.price - PLATFORM_FEE}("");
        require(sent1, "Payment to creator failed");

        (bool sent2, ) = payable(owner()).call{value: PLATFORM_FEE}("");
        require(sent2, "Payment to platform failed");

        emit NFTMinted(newTokenId, to, voucher.price);
        return newTokenId;
    }

    /**
     * @dev Get total number of tokens
     */
    function getTotalTokens() external view returns (uint256) {
        return _tokenIds.current();
    }

    /**
     * @dev Get all tokens owned by an address
     */
    function getTokenByOwner(address owner) external view returns (uint256[] memory) {
        uint256 totalTokens = _tokenIds.current();
        uint256[] memory tempTokens = new uint256[](totalTokens);
        uint256 count = 0;

        for (uint256 i = 1; i <= totalTokens; i++) {
            if (ownerOf(i) == owner) {
                tempTokens[count] = i;
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = tempTokens[i];
        }
        return result;
    }

    // Override functions to resolve conflicts
    function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}