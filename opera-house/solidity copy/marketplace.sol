// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./OperahouseMarketplaceRoyalty.sol";

contract Marketplace is ReentrancyGuard, Ownable, OperahouseMarketplaceRoyalty {
    using Counters for Counters.Counter;
    using SafeMath for uint256;
    using Address for address;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;
    Counters.Counter private _items;
    Counters.Counter private _soldItems;
    address adminAddress;
    bool marketplaceStatus;

    uint256 listingFee = 0.25 ether; // minimum price, change for what you want
    uint256 _serviceFee = 0;

    struct Bid {
        uint256 tokenId;
        uint256 price;
        address bidder;
        uint256 expireTimestamp;
    }

    struct TokenBids {
        EnumerableSet.AddressSet bidders;
        mapping(address => Bid) bids;
    }

    struct ListItem {
        uint256 tokenId;
        uint256 price;
        address seller;
        address paymentToken;
        bool listType;
        uint256 expireTimestamp;
        uint256 time;
    }

    struct CollectionMarket {
      EnumerableSet.UintSet tokenIdsListing;
      mapping(uint256 => ListItem) listings;
      EnumerableSet.UintSet tokenIdsWithBid;
      mapping(uint256 => TokenBids) bids;
    }

    mapping(address => CollectionMarket) private _marketplaceSales;

    // declare a event for when a item is created on marketplace
    event TokenListed(
        address indexed nftContractAddress,
        uint256 indexed tokenId,
        ListItem listing
    );
    event TokenDelisted(
        address indexed erc721Address,
        uint256 indexed tokenId,
        ListItem listing
    );
    event TokenBidEntered(
        address indexed erc721Address,
        uint256 indexed tokenId,
        Bid bid
    );
    event TokenBidWithdrawn(
        address indexed erc721Address,
        uint256 indexed tokenId,
        Bid bid
    );
    event TokenBought(
        address indexed erc721Address,
        uint256 indexed tokenId,
        address indexed buyer,
        ListItem listing,
        uint256 serviceFee,
        uint256 royaltyFee
    );
    event TokenBidAccepted(
        address indexed erc721Address,
        uint256 indexed tokenId,
        address indexed seller,
        Bid bid,
        uint256 serviceFee,
        uint256 royaltyFee
    );

    constructor() {
        adminAddress = 0x499FbD6C82C7C5D42731B3E9C06bEeFdC494C852;
        marketplaceStatus = true;
    }

    modifier onlyMarketplaceOpen() {
        require(marketplaceStatus, "Listing and bid are not enabled");
        _;
    }

    function _isTokenApprovedERC721(address erc721Address, uint256 tokenId)
        private
        view
        returns (bool)
    {
        IERC721 _erc721 = IERC721(erc721Address);
        try _erc721.getApproved(tokenId) returns (address tokenOperator) {
            return tokenOperator == address(this);
        } catch {
            return false;
        }
    }

    function _isAllTokenApprovedERC721(address erc721Address, address owner)
        private
        view
        returns (bool)
    {
        IERC721 _erc721 = IERC721(erc721Address);
        return _erc721.isApprovedForAll(owner, address(this));
    }

    function _isTokenOwnerERC721(
        address erc721Address,
        uint256 tokenId,
        address account
    ) private view returns (bool) {
        IERC721 _erc721 = IERC721(erc721Address);
        try _erc721.ownerOf(tokenId) returns (address tokenOwner) {
            return tokenOwner == account;
        } catch {
            return false;
        }
    }

    function _isListItemValidERC721(address erc721Address, ListItem memory listItem)
        private
        view
        returns (bool isValid)
    {
        if (
            _isTokenOwnerERC721(erc721Address, listItem.tokenId, listItem.seller) &&
            (_isTokenApprovedERC721(erc721Address, listItem.tokenId) ||
                _isAllTokenApprovedERC721(erc721Address, listItem.seller)) &&
            listItem.price > 0 &&
            listItem.expireTimestamp > block.timestamp
        ) {
            isValid = true;
        }
    }

    function _isBidValid(address nftContract, Bid memory bid)
        private
        view
        returns (bool isValid)
    {
        if (
            !_isTokenOwnerERC721(nftContract, bid.tokenId, bid.bidder) &&
            bid.price > 0 &&
            bid.expireTimestamp > block.timestamp
        ) {
            isValid = true;
        }
    }

    // returns the listing price of the contract
    function getListingPrice() public view returns (uint256) {
        return listingFee;
    }

    function setListingPrice(uint8 price) external onlyOwner {
        require(
            price <= 25,
            "Attempt to set percentage higher than 2.5%."
        );
        listingFee = price;
    }

    function changeMarketplaceStatus (bool status) external onlyOwner {
        require(status != marketplaceStatus, "Already set.");
        marketplaceStatus = status;
    }

    // places an item for sale on the marketplace
    function listERC721Token(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 expireTimestamp
    ) public payable nonReentrant onlyMarketplaceOpen {
        require(price > 0, "Price must be at least 1 wei");
        require(
            msg.value == listingFee,
            "Price must be equal to listing price"
        );
        
        ListItem memory listItem = _marketplaceSales[nftContract].listings[tokenId];

        require(
            _isListItemValidERC721(nftContract, listItem),
            "Listing is not valid"
        );

        require(listItem.listType == false, "This nft is on auction.");
        require(listItem.tokenId == 0, "Already listed");

        listItem.tokenId = tokenId;
        listItem.price = price;
        listItem.paymentToken = address(0);
        listItem.expireTimestamp = expireTimestamp;

        _marketplaceSales[nftContract].tokenIdsListing.add(tokenId);

        if (listingFee > 0) {
            payable(adminAddress).transfer(listingFee);
        }
        emit TokenListed(nftContract, tokenId, listItem);
    }

    function listERC721Token(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        address paymentToken,
        uint256 expireTimestamp
    ) public payable nonReentrant onlyMarketplaceOpen {
        require(price > 0, "Price must be at least 1 wei");

        ListItem memory listItem = _marketplaceSales[nftContract].listings[tokenId];
        require(
            _isListItemValidERC721(nftContract, listItem),
            "Listing is not valid"
        );

        require(listItem.listType == false, "This nft is on auction.");
        require(listItem.tokenId == 0, "Already listed");
        listItem.tokenId = tokenId;
        listItem.price = price;
        listItem.paymentToken = paymentToken;
        listItem.expireTimestamp = expireTimestamp;

        _marketplaceSales[nftContract].tokenIdsListing.add(tokenId);
        
        
        if (listingFee > 0) {
            IERC20(paymentToken).transferFrom(msg.sender, adminAddress, listingFee);
        }
        emit TokenListed(nftContract, tokenId, listItem);
    }

    function buyToken(
        address nftContract,
        uint256 tokenId
    ) external payable nonReentrant onlyMarketplaceOpen {

        ListItem memory listItem = _marketplaceSales[nftContract].listings[tokenId];
        require(
            _isListItemValidERC721(nftContract, listItem),
            "Not for sale"
        );

        require(
            !_isTokenOwnerERC721(nftContract, tokenId, msg.sender),
            "Token owner can't buy their own token"
        );

        uint256 price = listItem.price;
        uint256 royaltyPrice;
        address recipient;
        uint256 serviceFee = _serviceFee.div(1000);
   
        if (checkRoyalties(nftContract)) {
            (recipient, royaltyPrice) = royaltyFromERC2981(nftContract, tokenId, price);
        } else {
            CollectionRoyalty memory collectionRoyalty = royalty(nftContract);
            recipient = collectionRoyalty.recipient;
            royaltyPrice = collectionRoyalty.feeFraction;
        }

        if (listItem.paymentToken == address(0)) {
            require(
                msg.value >= listItem.price,
                "The value send is below sale price"
            );
            if (recipient != address(0)) Address.sendValue(payable(recipient), royaltyPrice);
            Address.sendValue(payable(adminAddress), serviceFee);
        } else {
            if (recipient != address(0)) IERC20(listItem.paymentToken).safeTransfer(recipient, royaltyPrice);
            IERC20(listItem.paymentToken).safeTransfer(adminAddress, serviceFee);
        }

        IERC721(nftContract).safeTransferFrom(listItem.seller, msg.sender, tokenId);

        emit TokenBought(
            nftContract,
            tokenId,
            msg.sender,
            listItem,
            serviceFee,
            royaltyPrice
        );
    }

    function enterBid(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 expireTimestamp
    )
        public nonReentrant onlyMarketplaceOpen
    {
        Bid memory bid = Bid(tokenId, price, msg.sender, expireTimestamp);

        require(_marketplaceSales[nftContract].tokenIdsWithBid.contains(tokenId), "Not for bid");

        ListItem memory listItem = _marketplaceSales[nftContract].listings[tokenId];
        address paymentToken = listItem.paymentToken;

        require(_isBidValid(nftContract, bid), "Bid is not valid");
        if (paymentToken == address(0)) {
            require(address(msg.sender).balance >= price, "Insurance money");
        } else {
            require((IERC20(paymentToken).balanceOf(msg.sender) >= price &&
                IERC20(paymentToken).allowance(msg.sender, address(this)) >= price),
                "Insurance money or not approved"
            );
        }

        _marketplaceSales[nftContract].tokenIdsWithBid.add(tokenId);
        _marketplaceSales[nftContract].bids[tokenId].bidders.add(msg.sender);
        _marketplaceSales[nftContract].bids[tokenId].bids[msg.sender] = bid;

        emit TokenBidEntered(nftContract, tokenId, bid);

    }

    // creates the sale of a marketplace item
    // transfers ownership of the item, as well as funds between parties
    // function createMarketplaceSale(address nftContract, uint256 itemId)
    //     public
    //     payable
    //     nonReentrant
    // {
    //     uint256 price = idToMarketplaceItem[itemId].price;
    //     uint256 tokenId = idToMarketplaceItem[itemId].tokenId;

    //     require(
    //         msg.value == price,
    //         "Please submit the asking price in order to complete the purchase"
    //     );

    //     idToMarketplaceItem[itemId].seller.transfer(msg.value);
    //     IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
    //     idToMarketplaceItem[itemId].owner = payable(msg.sender);
    //     idToMarketplaceItem[itemId].sold = true;

    //     _soldItems.increment();

    //     payable(adminAddress).transfer(listingPrice);
    // }

    // // returns all unsold marketplace items
    // function fetchMarketplaceItems()
    //     public
    //     view
    //     returns (MarketplaceItem[] memory)
    // {
    //     uint256 itemCount = _items.current();
    //     uint256 unsoldItemCount = _items.current() - _soldItems.current();
    //     uint256 currentIndex = 0;

    //     MarketplaceItem[] memory items = new MarketplaceItem[](unsoldItemCount);
    //     for (uint256 i = 0; i < itemCount; i++) {
    //         if (idToMarketplaceItem[i + 1].owner == address(0)) {
    //             uint256 currentId = i + 1;
    //             MarketplaceItem storage currentItem = idToMarketplaceItem[
    //                 currentId
    //             ];
    //             items[currentIndex] = currentItem;
    //             currentIndex += 1;
    //         }
    //     }
    //     return items;
    // }

    // // returns only items that a user has purchased
    // function fetchMyNFTs() public view returns (MarketplaceItem[] memory) {
    //     uint256 totalItemCount = _items.current();
    //     uint256 itemCount = 0;
    //     uint256 currentIndex = 0;

    //     for (uint256 i = 0; i < totalItemCount; i++) {
    //         if (idToMarketplaceItem[i + 1].owner == msg.sender) {
    //             itemCount += 1;
    //         }
    //     }

    //     MarketplaceItem[] memory items = new MarketplaceItem[](itemCount);
    //     for (uint256 i = 0; i < totalItemCount; i++) {
    //         if (idToMarketplaceItem[i + 1].owner == msg.sender) {
    //             uint256 currentId = i + 1;
    //             MarketplaceItem storage currentItem = idToMarketplaceItem[
    //                 currentId
    //             ];
    //             items[currentIndex] = currentItem;
    //             currentIndex += 1;
    //         }
    //     }
    //     return items;
    // }

    // // returns only items a user has created
    // function fetchItemsCreated()
    //     public
    //     view
    //     returns (MarketplaceItem[] memory)
    // {
    //     uint256 totalItemCount = _items.current();
    //     uint256 itemCount = 0;
    //     uint256 currentIndex = 0;

    //     for (uint256 i = 0; i < totalItemCount; i++) {
    //         if (idToMarketplaceItem[i + 1].seller == msg.sender) {
    //             itemCount += 1;
    //         }
    //     }

    //     MarketplaceItem[] memory items = new MarketplaceItem[](itemCount);

    //     for (uint256 i = 0; i < totalItemCount; i++) {
    //         if (idToMarketplaceItem[i + 1].seller == msg.sender) {
    //             uint256 currentId = i + 1;
    //             MarketplaceItem storage currentItem = idToMarketplaceItem[
    //                 currentId
    //             ];
    //             items[currentIndex] = currentItem;
    //             currentIndex += 1;
    //         }
    //     }

    //     return items;
    // }
}
