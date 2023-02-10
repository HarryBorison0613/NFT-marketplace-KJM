// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

interface IOperahouseMarketplaceRoyalty {
    struct CollectionRoyalty {
        address recipient;
        uint256 feeFraction;
        address setBy;
    }

    // Who can set: ERC721 owner and admin
    event SetRoyalty(
        address indexed collectionAddress,
        address indexed recipient,
        uint256 feeFraction
    );

    /**
     * @dev Royalty fee
     * @param collectionAddress to read royalty
     * @return royalty information
     */
    function royalty(address collectionAddress)
        external
        view
        returns (CollectionRoyalty memory);

    /**
     * @dev Royalty fee
     * @param collectionAddress to read royalty
     */
    function setRoyalty(
        address collectionAddress,
        address recipient,
        uint256 feeFraction
    ) external;
}
