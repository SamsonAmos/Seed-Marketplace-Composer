// This component is used to display all the seed listings in the system

// Importing dependencies
import { useState } from "react";
// Import the useContractCall hook to read how many seed listings are available via the smart contract
import { useContractCall } from "@/hooks/contracts/useContractRead";
// Import the SeedListing and alert components
import SeedListing from "@/components/SeedListing";
import ErrorAlert from "@/components/alerts/ErrorAlert";
import LoadingAlert from "@/components/alerts/LoadingAlert";
import SuccessAlert from "@/components/alerts/SuccessAlert";

// Define the SeedListingList component
const SeedListingList = () => {
  // Use the useContractCall hook to fetch the number of seed listings available from the smart contract
  const { data } = useContractCall("getSeedLength", [], true);

  // Convert the retrieved data into a number, which will represent the total number of seed listings
  const listingLength = data ? Number(data.toString()) : 0;

  // States for error, success, and loading messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState("");

  // Function to clear any existing messages
  const clear = () => {
    setError("");
    setSuccess("");
    setLoading("");
  };

  // Function to generate the seed listing components dynamically
  const getListings = () => {
    // If there are no seed listings, return null
    if (!listingLength) return null;

    const listings = [];

    // Loop through each seed listing index and generate a SeedListing component for each one
    for (let i = 0; i < listingLength; i++) {
      listings.push(
        <SeedListing
          key={i}
          id={i}
          setError={setError}
          setLoading={setLoading}
          loading={loading}
          clear={clear}
        />
      );
    }

    return listings;
  };

  // Return the JSX for the component
  return (
    <div>
      {/* Display alerts if there are any messages */}
      {error && <ErrorAlert message={error} clear={clear} />}
      {success && <SuccessAlert message={success} />}
      {loading && <LoadingAlert message={loading} />}

      {/* Display seed listings */}
      <div className="mx-auto max-w-2xl py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <h2 className="sr-only">Seed Listings</h2>
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
          {/* Render the seed listings */}
          {getListings()}
        </div>
      </div>
    </div>
  );
};

export default SeedListingList;
