// This component is used to create a seed listing

// Importing the necessary dependencies and hooks
import { useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi"; // Hooks for handling account and balance in web3
import { toast } from "react-toastify"; // For user notifications
import { useDebounce } from "use-debounce"; // Debouncing input for better performance
import { useContractSend } from "@/hooks/contracts/useContractWrite"; // Hook for sending transactions
import erc20Instance from "../abi/erc20.json"; // ERC20 ABI for interacting with token contracts
import { ethers } from "ethers"; // Ethers.js for handling blockchain interactions

// Component to create a seed listing
const CreateSeedListingModal = () => {
  // State to manage the modal visibility
  const [modalVisible, setModalVisible] = useState(false);

  // States to store form inputs for seed listing creation
  const [seedName, setSeedName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string | number>(0);
  const [quantity, setQuantity] = useState<string | number>(0);
  const [imageUrl, setImageUrl] = useState("");

  // Debounced states for input values to prevent excessive re-renders
  const [debouncedSeedName] = useDebounce(seedName, 500);
  const [debouncedDescription] = useDebounce(description, 500);
  const [debouncedPrice] = useDebounce(price, 500);
  const [debouncedQuantity] = useDebounce(quantity, 500);
  const [debouncedImageUrl] = useDebounce(imageUrl, 500);

  // State to handle loading status while interacting with the contract
  const [loading, setLoading] = useState("");

  // Function to check if all input fields are completed
  const isFormComplete =
    seedName && description && price && quantity && imageUrl;

  // Function to reset the form after listing creation
  const clearForm = () => {
    setSeedName("");
    setDescription("");
    setPrice(0);
    setQuantity(0);
    setImageUrl("");
  };

  // Convert the seed price from ether to wei (smallest denomination in Ethereum)
  const seedPriceInWei = ethers.utils.parseEther(
    `${debouncedPrice.toString() || 0}`
  );

  // Hook to interact with the smart contract's "listSeed" function
  const { writeAsync: listSeed } = useContractSend("listSeed", [
    debouncedSeedName,
    debouncedDescription,
    seedPriceInWei,
    debouncedQuantity,
    debouncedImageUrl,
  ]);

  // Function to handle the seed listing creation process
  const handleCreateSeedListing = async () => {
    if (!listSeed) {
      throw "Failed to create seed listing";
    }
    setLoading("Creating...");
    if (!isFormComplete) throw new Error("Please fill all fields");

    // Interact with the smart contract to create the listing
    const createListingTx = await listSeed();
    setLoading("Waiting for confirmation...");
    await createListingTx.wait(); // Wait for transaction confirmation

    // Close the modal and clear the form
    setModalVisible(false);
    clearForm();
  };

  // Function to handle form submission and provide user feedback via toast notifications
  const createListing = async (e: any) => {
    e.preventDefault(); // Prevent default form submission behavior
    try {
      await toast.promise(handleCreateSeedListing(), {
        pending: "Creating Listing...",
        success: "Listing created successfully",
        error: "Something went wrong. Try again.",
      });
    } catch (e: any) {
      console.log({ e });
      toast.error(e?.message || "Something went wrong. Try again.");
    } finally {
      setLoading("");
    }
  };

  return (
    <div className={"flex flex-row w-full justify-between"}>
      <div>
        {/* Button to toggle the visibility of the modal */}
        <button
          type="button"
          onClick={() => setModalVisible(true)}
          className="inline-block ml-4 px-6 py-2.5 bg-black text-white font-medium text-md leading-tight rounded-1xl shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out"
          data-bs-toggle="modal"
          data-bs-target="#exampleModalCenter"
        >
          Create Seed Listing
        </button>

        {/* Modal for creating a seed listing */}
        {modalVisible && (
          <div
            className="fixed z-40 overflow-y-auto top-0 w-full left-0"
            id="modal"
          >
            {/* Form to create a seed listing */}
            <form onSubmit={createListing}>
              <div className="flex items-center justify-center min-height-100vh pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity">
                  <div className="absolute inset-0 bg-gray-900 opacity-75" />
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
                  &#8203;
                </span>
                <div
                  className="inline-block align-center bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="modal-headline"
                >
                  {/* Modal Header */}
                  <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">
                      Create Seed Listing
                    </h2>
                  </div>

                  {/* Modal Body with input fields for seed details */}
                  <div
                    className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 overflow-y-auto"
                    style={{ maxHeight: "400px" }}
                  >
                    {/* Input field for seed name */}
                    <label>Seed Name</label>
                    <input
                      onChange={(e) => setSeedName(e.target.value)}
                      required
                      type="text"
                      className="w-full bg-gray-100 p-2 mt-2 mb-3"
                    />

                    {/* Input field for seed description */}
                    <label>Description</label>
                    <textarea
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      className="w-full bg-gray-100 p-2 mt-2 mb-3"
                    />

                    {/* Input field for seed price */}
                    <label>Price (in cUSD)</label>
                    <input
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      type="number"
                      min="1"
                      className="w-full bg-gray-100 p-2 mt-2 mb-3"
                    />

                    {/* Input field for seed quantity */}
                    <label>Quantity (in units)</label>
                    <input
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      type="number"
                      min="1"
                      className="w-full bg-gray-100 p-2 mt-2 mb-3"
                    />

                    {/* Input field for image URL */}
                    <label>Image URL</label>
                    <input
                      onChange={(e) => setImageUrl(e.target.value)}
                      required
                      type="text"
                      className="w-full bg-gray-100 p-2 mt-2 mb-3"
                    />
                  </div>

                  {/* Modal Footer with cancel and create buttons */}
                  <div className="bg-gray-200 px-4 py-3 text-right">
                    {/* Cancel button to close the modal */}
                    <button
                      type="button"
                      className="py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700 mr-2"
                      onClick={() => setModalVisible(false)}
                    >
                      <i className="fas fa-times"></i> Cancel
                    </button>

                    {/* Submit button to create the seed listing */}
                    <button
                      type="submit"
                      disabled={!!loading || !isFormComplete || !listSeed}
                      className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-700 mr-2"
                    >
                      {loading ? loading : "Create"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateSeedListingModal;
