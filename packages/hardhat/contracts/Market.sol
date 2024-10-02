// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Interface for the ERC20 token, in our case cUSD
interface IERC20Token {
    function transfer(address, uint256) external returns (bool);
    function approve(address, uint256) external returns (bool);
    function transferFrom(address, address, uint256) external returns (bool);
    function totalSupply() external view returns (uint256);
    function balanceOf(address) external view returns (uint256);
    function allowance(address, address) external view returns (uint256);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract FarmerMarketplace is ReentrancyGuard {
    using SafeMath for uint256;

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

    event SeedListed(
        uint256 id,
        address farmerId,
        string seedName,
        uint256 seedPrice,
        uint256 quantity
    );
    event SeedPurchased(uint256 id, address buyer, uint256 quantity);
    event CommentAdded(uint256 seedId, address commenter, string message);

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
        emit SeedListed(
            seedCount,
            msg.sender,
            _seedName,
            _seedPrice,
            _quantity
        );
        seedCount++;
    }

    function purchaseSeed(
        uint256 _index,
        uint256 _quantity
    ) public payable nonReentrant {
        require(_index < seedCount, "Invalid seed index");
        require(_quantity > 0, "Quantity must be greater than zero");
        require(
            seeds[_index].quantity >= _quantity,
            "Not enough quantity available"
        );

        uint256 totalPrice = seeds[_index].seedPrice.mul(_quantity);

        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                seeds[_index].farmerId,
                totalPrice
            ),
            "Transfer failed."
        );

        seeds[_index].seedSold = seeds[_index].seedSold.add(_quantity);
        seeds[_index].quantity = seeds[_index].quantity.sub(_quantity);

        emit SeedPurchased(_index, msg.sender, _quantity);
    }

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

    function addComment(uint256 _seedId, string memory _message) public {
        require(_seedId < seedCount, "Seed does not exist.");
        seedComments[_seedId].push(
            Comment({
                commenter: msg.sender,
                message: _message,
                timestamp: block.timestamp
            })
        );
        emit CommentAdded(_seedId, msg.sender, _message);
    }

    function getComments(
        uint256 _seedId
    ) public view returns (Comment[] memory) {
        require(_seedId < seedCount, "Seed does not exist.");
        return seedComments[_seedId];
    }

    function deleteSeed(uint256 id) public {
        require(id < seedCount, "Invalid seed index");
        require(
            msg.sender == seeds[id].farmerId,
            "Only the owner can delete this seed"
        );

        delete seedComments[id];
        delete seeds[id];

        seedCount--;
    }

    function getSeedLength() public view returns (uint256) {
        return seedCount;
    }
}
