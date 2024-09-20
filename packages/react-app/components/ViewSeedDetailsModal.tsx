// Importing dependencies
import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { toast } from "react-toastify";
import { useDebounce } from "use-debounce";
import { useContractSend } from "@/hooks/contracts/useContractWrite";
import erc20Instance from "../abi/erc20.json";
import { ethers } from "ethers";
import Link from "next/link";
import { identiconTemplate } from "@/helpers";
import { useContractApprove } from "@/hooks/contracts/useApprove";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import CommentSection from "./CommentSection";

interface Listing {
  id: number;
  farmerId: string;
  seedName: string;
  description: string;
  seedPrice: number;
  quantity: number;
  imageUrl: string;
  seedSold: number;
}

// Component to display seed listing details and handle seed purchases
const ViewSeedDetailsModal = ({ listing }: { listing: Listing }) => {
  // State to toggle the modal visibility
  const [visible, setVisible] = useState(false);

  // States for form fields
  const [seedName, setSeedName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string | number>(0);
  const [quantity, setQuantity] = useState<string | number>(0);
  const [imageUrl, setImageUrl] = useState("");

  // Debounced values for optimized input handling
  const [debouncedSeedName] = useDebounce(seedName, 500);
  const [debouncedDescription] = useDebounce(description, 500);
  const [debouncedPrice] = useDebounce(price, 500);
  const [debouncedQuantity] = useDebounce(quantity, 500);
  const [debouncedImageUrl] = useDebounce(imageUrl, 500);

  // Fetch user account details
  const { address } = useAccount();

  // Loading, error, and success state management
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [quantityToBuy, setQuantityToBuy] = useState(1); // Default to 1 unit

  // Format seed price from Wei to cUSD
  const seedPriceFromWei = ethers.utils.formatEther(
    listing.seedPrice.toString()
  );
  const productPriceToInt = parseFloat(seedPriceFromWei);
  const totalPrice = quantityToBuy * productPriceToInt; // Total cost based on quantity

  // Clear all input fields
  const clearForm = () => {
    setSeedName("");
    setDescription("");
    setPrice(0);
    setQuantity(0);
    setImageUrl("");
  };

  // Function to reset error, success, and loading states
  const clear = () => {
    setError("");
    setSuccess("");
    setLoading("");
  };

  // Convert price to Wei format for transactions
  const seedPriceInWei = ethers.utils.parseEther(
    `${debouncedPrice.toString() || 0}`
  );

  // Contract interactions for listing, purchasing, and approving
  const { writeAsync: listSeed } = useContractSend("listSeed", [
    debouncedSeedName,
    debouncedDescription,
    seedPriceInWei,
    debouncedQuantity,
    debouncedImageUrl,
  ]);

  const { writeAsync: purchase } = useContractSend("purchaseSeed", [
    Number(listing.id),
    Number(quantityToBuy),
  ]);

  const { writeAsync: approve } = useContractApprove(
    (listing?.seedPrice * quantityToBuy).toString() || "0"
  );

  const { openConnectModal } = useConnectModal();

  // Handle the seed purchase
  const handlePurchase = async () => {
    if (!approve || !purchase) {
      throw new Error("Failed to purchase this product");
    }
    // Approve spending of cUSD for the seed
    const approveTx = await approve();
    await approveTx.wait(1); // Wait for transaction confirmation
    setLoading("Purchasing...");
    const res = await purchase();
    await res.wait();
  };

  // Purchase seed with proper UI feedback
  const purchaseProduct = async () => {
    setLoading("Approving ...");
    clear();

    try {
      if (!address && openConnectModal) {
        openConnectModal(); // Trigger wallet connect modal if user is not connected
        return;
      }
      await toast.promise(handlePurchase(), {
        pending: "Purchasing product...",
        success: "Product purchased successfully",
        error: "Failed to purchase product",
      });
    } catch (e: any) {
      setError(e?.reason || e?.message || "Something went wrong. Try again.");
    } finally {
      setLoading("");
    }
  };

  // Increment or decrement the quantity to buy
  const incrementQuantity = () => {
    if (quantityToBuy < listing.quantity) {
      setQuantityToBuy(quantityToBuy + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantityToBuy > 1) {
      setQuantityToBuy(quantityToBuy - 1);
    }
  };

  return (
    <div className="flex flex-row w-full justify-between">
      <div>
        {/* Button to open the modal */}
        <button
          type="button"
          onClick={() => setVisible(true)}
          className="mt-4 w-full border-[1px] border-gray-500 text-black p-2 rounded-lg hover:bg-black hover:text-white"
          data-bs-toggle="modal"
          data-bs-target="#exampleModalCenter"
        >
          View More Details
        </button>

        {/* Modal for displaying seed details */}
        {visible && (
          <div
            className="fixed z-40 overflow-y-auto top-0 w-full left-0"
            id="modal"
          >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity">
                <div className="absolute inset-0 bg-gray-900 opacity-75" />
              </div>

              {/* Modal content */}
              <div
                className="inline-block align-center bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-headline"
              >
                {/* Modal Header */}
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Details</h2>
                </div>

                {/* Modal Body */}
                <div
                  className="bg-white px-4 overflow-y-auto"
                  style={{ maxHeight: "500px" }}
                >
                  <div className="relative">
                    {/* Image and Farmer Details */}
                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-white xl:aspect-w-7 xl:aspect-h-8">
                      <img
                        src={listing.imageUrl}
                        alt={listing.seedName}
                        className="w-full h-60 rounded-t-md object-cover object-center"
                      />
                      <Link
                        href={`https://explorer.celo.org/alfajores/address/${listing.farmerId}`}
                        className="absolute -mt-7 ml-6 h-10 w-10 rounded-full"
                      >
                        {identiconTemplate(listing.farmerId)}
                      </Link>
                    </div>

                    {/* Seed and Pricing Details */}
                    <div
                      className="m-5"
                      style={{ textTransform: "capitalize", marginTop: "35px" }}
                    >
                      <div className="flex justify-between mt-5">
                        <h3>Seed name:</h3>
                        <p>{listing.seedName}</p>
                      </div>

                      <div className="flex justify-between my-2">
                        <h3>Price:</h3>
                        <p>{productPriceToInt} cUSD</p>
                      </div>

                      <div className="flex justify-between my-2">
                        <h3>Qty Available:</h3>
                        <p>{listing.quantity}</p>
                      </div>

                      {/* Quantity Selection */}
                      <div className="flex justify-between my-2">
                        <h3>Quantity to Buy:</h3>
                        <div className="flex items-center">
                          <button
                            onClick={decrementQuantity}
                            className="px-2 py-1 bg-gray-300 rounded"
                          >
                            -
                          </button>
                          <p className="mx-2">{quantityToBuy}</p>
                          <button
                            onClick={incrementQuantity}
                            className="px-2 py-1 bg-gray-300 rounded"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Divider and Comment Section */}
                      <hr className="my-4 border-gray-400" />
                      <p className="text-center text-gray-600">
                        Comment Section
                      </p>
                      <CommentSection id={listing.id} />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-100 px-4 py-3 border-t border-gray-200">
                  <button
                    onClick={() => setVisible(false)}
                    type="button"
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Close
                  </button>

                  <button
                    disabled={!!loading}
                    onClick={purchaseProduct}
                    type="button"
                    className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mt-2"
                  >
                    {loading || `Purchase for ${totalPrice} cUSD`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewSeedDetailsModal;
