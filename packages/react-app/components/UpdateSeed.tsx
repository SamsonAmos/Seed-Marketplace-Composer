import { useState } from "react";
import { useDebounce } from "use-debounce";
import { useContractSend } from "@/hooks/contracts/useContractWrite";

interface Listing {
  id: number;
  quantity: number;
}

// Component to display seed listing details and handle seed updates
const UpdateSeedDetailsModal = ({ listing }: { listing: Listing }) => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState("");
  const [quantity, setQuantity] = useState<string | number>(listing.quantity);

  // Debounced values for optimized input handling
  const [debouncedId] = useDebounce(listing.id, 500);
  const [debouncedQuantity] = useDebounce(quantity, 500);

  // Hook to interact with the smart contract's "updateSeed" function
  const { writeAsync: updateSeedQuantity } = useContractSend(
    "updateSeedQuantity",
    [debouncedId, debouncedQuantity]
  );

  // Function to handle the seed update process
  const handleUpdateSeed = async () => {
    if (!updateSeedQuantity) throw new Error("Failed to update seed quantity");

    setLoading("Updating...");
    const updateSeedTx = await updateSeedQuantity();
    setLoading("Waiting for confirmation...");
    await updateSeedTx.wait(); // Wait for transaction confirmation
    setVisible(false); // Close the modal
  };

  // Function to handle form submission
  const updateSeedQuantityById = async (e: any) => {
    e.preventDefault(); // Prevent default form submission behavior
    try {
      await handleUpdateSeed();
    } catch (e: any) {
      console.error(e.message || "Something went wrong.");
    } finally {
      setLoading("");
    }
  };

  return (
    <div>
      {/* Button to open the modal */}
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="w-full border-[1px] border-gray-500 text-black p-2 rounded-lg hover:bg-black hover:text-white"
      >
        Update Seed Quantity
      </button>

      {/* Modal for updating seed details */}
      {visible && (
        <div className="fixed z-40 top-0 w-full left-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 bg-gray-900 opacity-75"></div>

            <div className="inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Update Seed Quantity
                </h2>
              </div>

              <form onSubmit={updateSeedQuantityById}>
                <div
                  className="bg-white px-4 pt-5 pb-4 sm:p-6 overflow-y-auto"
                  style={{ maxHeight: "400px" }}
                >
                  {/* Input field for seed quantity */}
                  <label>Quantity (in units)</label>
                  <input
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    type="number"
                    min="0"
                    className="w-full bg-gray-100 p-2 mt-2 mb-3"
                    value={quantity}
                  />
                </div>

                <div className="bg-gray-200 px-4 py-3 text-right">
                  {/* Cancel button */}
                  <button
                    type="button"
                    className="py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700 mr-2"
                    onClick={() => setVisible(false)}
                  >
                    Cancel
                  </button>

                  {/* Submit button */}
                  <button
                    type="submit"
                    className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-700 mr-2"
                  >
                    {loading || "Update"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateSeedDetailsModal;
