// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Interface for the ERC20 token, in our case cUSD
interface IERC20Token {
    // Transfers tokens from one address to another
    function transfer(address, uint256) external returns (bool);

    // Approves a transfer of tokens from one address to another
    function approve(address, uint256) external returns (bool);

    // Transfers tokens from one address to another, with the permission of the first address
    function transferFrom(address, address, uint256) external returns (bool);

    // Returns the total supply of tokens
    function totalSupply() external view returns (uint256);

    // Returns the balance of tokens for a given address
    function balanceOf(address) external view returns (uint256);

    // Returns the amount of tokens that an address is allowed to transfer from another address
    function allowance(address, address) external view returns (uint256);

    // Event for token transfers
    event Transfer(address indexed from, address indexed to, uint256 value);
    // Event for approvals of token transfers
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract FarmerMarketplace {
    uint256 internal seedCount = 0;
    address internal cUsdTokenAddress =
        0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    struct Seed {
        uint256 id;
        address payable farmerId;
        string seedName;
        string description;
        uint256 seedPrice;
        uint256 quantity;
        string imageUrl;
        uint256 seedSold;
    }

    struct Comment {
        address commenter;
        string message;
        uint256 timestamp;
    }

    mapping(uint256 => Seed) public seeds;
    mapping(uint256 => Comment[]) public seedComments;

    // Function to list a seed
    function listSeed(
        string memory _seedName,
        string memory _description,
        uint256 _seedPrice,
        uint256 _quantity,
        string memory _imageUrl
    ) public {
        seeds[seedCount] = Seed(
            seedCount,
            payable(msg.sender),
            _seedName,
            _description,
            _seedPrice,
            _quantity,
            _imageUrl,
            0
        );
        // emit SeedListed(seedCount, msg.sender, _name, _price, _quantity);
        seedCount++;
    }

    // Buys a product from the marketplace
    function purchaseSeed(
        // Index of the product
        uint256 _index,
        uint256 _quantity
    ) public payable {
        // Transfers the tokens from the buyer to the seller
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                // Sender's address is the buyer
                msg.sender,
                // Receiver's address is the seller
                seeds[_index].farmerId,
                // Amount of tokens to transfer is the price of the product
                seeds[_index].seedPrice
            ),
            // If transfer fails, throw an error message
            "Transfer failed."
        );
        // Increases the number of times the product has been sold
        seeds[_index].seedSold += _quantity;
        seeds[_index].quantity -= _quantity;
    }

    // Function to view seed details
    function getSeed(
        uint256 _seedId
    )
        public
        view
        returns (
            uint256 id,
            address farmerId,
            string memory seedName,
            string memory description,
            uint256 seedPrice,
            uint256 quantity,
            string memory imageUrl,
            uint256 seedSold
        )
    {
        Seed memory seed = seeds[_seedId];
        return (
            seed.id,
            seed.farmerId,
            seed.seedName,
            seed.description,
            seed.seedPrice,
            seed.quantity,
            seed.imageUrl,
            seed.seedSold
        );
    }

    // Function to add a comment to a seed
    function addComment(uint256 _seedId, string memory _message) public {
        require(_seedId < seedCount, "Seed does not exist.");
        seedComments[_seedId].push(
            Comment({
                commenter: msg.sender,
                message: _message,
                timestamp: block.timestamp
            })
        );
    }

    // Function to get comments for a seed
    function getComments(
        uint256 _seedId
    ) public view returns (Comment[] memory) {
        require(_seedId < seedCount, "Seed does not exist.");
        return seedComments[_seedId];
    }

    // Function to delete a seed and associated comments
    function deleteSeed(uint256 id) public {
        require(id < seedCount, "Invalid seed index");
        require(
            msg.sender == seeds[id].farmerId,
            "Only the owner can delete this seed"
        );

        // Delete associated comments
        delete seedComments[id];

        // Shift seeds and comments to maintain proper indexing
        for (uint256 i = id; i < seedCount - 1; i++) {
            // Shift seeds
            seeds[i] = seeds[i + 1];

            // Shift associated comments
            seedComments[i] = seedComments[i + 1];
        }

        // Clear the last element for both seeds and comments
        delete seeds[seedCount - 1];
        delete seedComments[seedCount - 1];

        // Decrement the seed count
        seedCount--;
    }

    function getSeedLength() public view returns (uint256) {
        return (seedCount);
    }
}
