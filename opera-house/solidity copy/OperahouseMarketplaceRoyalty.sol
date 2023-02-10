// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "./IOperahouseMarketplaceRoyalty.sol";

contract OperahouseMarketplaceRoyalty is IOperahouseMarketplaceRoyalty, Ownable {

    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;
    uint256 public defaultRoyaltyFraction = 20; // By the factor of 1000, 2%
    uint256 public royaltyUpperLimit = 80; // By the factor of 1000, 8%

    mapping(address => CollectionRoyalty) private _collectionRoyalty;

    function checkRoyalties(address _contract) internal returns (bool) {
        (bool success) = IERC165(_contract).supportsInterface(_INTERFACE_ID_ERC2981);
        return success;
    }

    function _collectionOwner(address collectionAddress)
        private
        view
        returns (address)
    {
        try Ownable(collectionAddress).owner() returns (address _owner) {
            return _owner;
        } catch {
            return address(0);
        }
    }

    function royalty(address collectionAddress, uint256 tokenId)
        public
        view
        override
        returns (CollectionRoyalty memory)
    {
        if (checkRoyalties(collectionAddress)) {
            (address recipient, uint256 royalty) = IERC2981(collectionAddress).royaltyInfo(tokenId);
            return CollectionRoyalty({
                    recipient: recipient,
                    feeFraction: royalty,
                    setBy: address(0)
                });
        } else {
            if (_collectionRoyalty[collectionAddress].setBy != address(0)) {
                return _collectionRoyalty[collectionAddress];
            }

            address collectionOwner = _collectionOwner(collectionAddress);
            if (collectionOwner != address(0)) {
                return
                    CollectionRoyalty({
                        recipient: collectionOwner,
                        feeFraction: defaultRoyaltyFraction,
                        setBy: address(0)
                    });
            }

            return
                CollectionRoyalty({
                    recipient: address(0),
                    feeFraction: 0,
                    setBy: address(0)
                });
        }
    }

    function setRoyalty(
        address collectionAddress,
        address newRecipient,
        uint256 feeFraction
    ) external override {
        require(
            feeFraction <= royaltyUpperLimit,
            "Please set the royalty percentange below allowed range"
        );

        require(
            msg.sender == royalty(collectionAddress).recipient,
            "Only royalty recipient is allowed to set Royalty"
        );

        _collectionRoyalty[collectionAddress] = CollectionRoyalty({
            recipient: newRecipient,
            feeFraction: feeFraction,
            setBy: msg.sender
        });

        emit SetRoyalty({
            collectionAddress: collectionAddress,
            recipient: newRecipient,
            feeFraction: feeFraction
        });
    }

    function setRoyaltyForCollection(
        address collectionAddress,
        address newRecipient,
        uint256 feeFraction
    ) external onlyOwner {
        require(
            feeFraction <= royaltyUpperLimit,
            "Please set the royalty percentange below allowed range"
        );

        require(
            royalty(collectionAddress).setBy == address(0),
            "Collection royalty recipient already set"
        );

        _collectionRoyalty[collectionAddress] = CollectionRoyalty({
            recipient: newRecipient,
            feeFraction: feeFraction,
            setBy: msg.sender
        });

        emit SetRoyalty({
            collectionAddress: collectionAddress,
            recipient: newRecipient,
            feeFraction: feeFraction
        });
    }

    function updateRoyaltyUpperLimit(uint256 _newUpperLimit)
        external
        onlyOwner
    {
        royaltyUpperLimit = _newUpperLimit;
    }
}
