/* eslint-disable @next/next/no-img-element */
// This component displays a seed listing and enables the deletion of the listing

// Importing dependencies
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { toast } from "react-toastify";
import { identiconTemplate } from "@/helpers";
import { useContractCall } from "@/hooks/contracts/useContractRead";
import { useContractSend } from "@/hooks/contracts/useContractWrite";
import { useDebounce } from "use-debounce";
import { useRouter } from "next/router";
import { ethers } from "ethers";
import ViewSeedDetailsModal from "@/components/ViewSeedDetailsModal";

// Define the interface for the seed listing data structure
interface SeedListing {
  id: number;
  farmerId: string;
  seedName: string;
  description: string;
  seedPrice: number;
  quantity: number;
  imageUrl: string;
  seedSold: number;
}

// Define the SeedListing component which takes in the id of the listing and some functions to display notifications
const SeedListing = ({
  id,
  setError,
  setLoading,
  loading,
  clear,
}: {
  id: number;
  setError: any;
  setLoading: any;
  loading: any;
  clear: any;
}) => {
  const [showReview, setShowReview] = useState(false);
  const [listing, setListing] = useState<SeedListing | null>(null);
  const [disable, setDisable] = useState(false);
  const show = showReview ? "block" : "hidden";

  const router = useRouter();
  const { address } = useAccount();
  const { data: listingData }: any = useContractCall("getSeed", [id], true);

  const [debouncedId] = useDebounce(id, 500);

  const { writeAsync: deleteSeedListing } = useContractSend("deleteSeed", [
    debouncedId,
  ]);

  // Handle deletion of the seed listing
  // const handleDelete = async () => {
  //   if (!deleteSeedListing) {
  //     throw new Error("Failed to delete seed listing");
  //   }
  //   setLoading("Deleting...");
  //   const deleteTx = await deleteSeedListing();
  //   setLoading("Waiting for confirmation...");
  //   await deleteTx.wait();
  // };

  // Delete listing handler
  // const deleteListing = async (e: any) => {
  //   e.preventDefault();
  //   try {
  //     await toast.promise(handleDelete(), {
  //       pending: "Deleting seed listing...",
  //       success: "Seed listing deleted successfully",
  //       error: "Failed to delete seed listing. Try again.",
  //     });
  //   } catch (error: any) {
  //     console.error({ error });
  //     toast.error(error?.message || "Something went wrong. Try again.");
  //   } finally {
  //     setLoading("");
  //   }
  // };

  // Handle deletion of the seed listing
  const handleDelete = async () => {
    if (!deleteSeedListing) {
      throw new Error("Delete functionality not available");
    }

    setLoading("Deleting...");

    try {
      const deleteTx = await deleteSeedListing();
      if (!deleteTx) {
        throw new Error("Transaction initiation failed");
      }

      setLoading("Waiting for confirmation...");
      const receipt = await deleteTx.wait();

      if (!receipt.status) {
        throw new Error("Transaction failed. Seed listing not deleted.");
      }

      return receipt;
    } catch (error: any) {
      throw new Error(error.message || "An error occurred during deletion");
    } finally {
      setLoading("");
    }
  };

  // Delete listing handler
  const deleteListing = async (e: any) => {
    e.preventDefault();

    // Basic reentrancy protection
    if (loading) {
      return; // Prevents the user from submitting multiple delete requests
    }

    try {
      await toast.promise(handleDelete(), {
        pending: "Deleting seed listing...",
        success: "Seed listing deleted successfully",
        error: "Failed to delete seed listing. Please try again.",
      });
    } catch (error: any) {
      console.error({ error });
      toast.error(error.message || "Something went wrong. Please try again.");
    }
  };

  const { openConnectModal } = useConnectModal();

  // Fetch and set listing data
  const getListingData = useCallback(() => {
    if (!listingData) return null;
    setListing({
      id: Number(listingData[0]),
      farmerId: listingData[1],
      seedName: listingData[2],
      description: listingData[3],
      seedPrice: Number(listingData[4]),
      quantity: Number(listingData[5]),
      imageUrl: listingData[6],
      seedSold: Number(listingData[7]),
    });
  }, [listingData]);

  useEffect(() => {
    getListingData();
  }, [getListingData]);

  if (!listing) return null;

  // Format the product price from Wei to a readable format
  const seedPriceFromWei = ethers.utils.formatEther(
    listing.seedPrice.toString()
  );

  // Convert the product price to a floating-point number
  const productPriceToInt = parseFloat(seedPriceFromWei);

  return (
    <div className={"shadow-lg relative rounded-b-lg "}>
      <div className="group">
        {/* Seed image and delete icon */}
        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-white xl:aspect-w-7 xl:aspect-h-8">
          <img
            src="/delete.png"
            alt="Delete Listing"
            className="absolute top-2 right-2 w-8 h-8 cursor-pointer"
            onClick={(e) => deleteListing(e)}
          />

          <img
            src={listing.imageUrl}
            alt={listing.seedName}
            className="w-full h-80 rounded-t-md object-cover object-center"
          />

          {/* Farmer Identicon and Link to Celo Explorer */}
          <Link
            href={`https://explorer.celo.org/alfajores/address/${listing.farmerId}`}
            className="absolute -mt-7 ml-6 h-16 w-16 rounded-full"
          >
            {identiconTemplate(listing.farmerId)}
          </Link>
        </div>

        {/* Seed Listing Details */}
        <div className="m-5" style={{ marginTop: "35px", fontSize: "13px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              textTransform: "capitalize",
            }}
            className="my-3"
          >
            <h3>Seed Name:</h3>
            <p>{listing.seedName}</p>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <h3>Price:</h3>
            <p>{productPriceToInt} cUSD</p>
          </div>

          {/* View Seed Details Modal */}
          <ViewSeedDetailsModal listing={listing} />
        </div>
      </div>
    </div>
  );
};

export default SeedListing;
