// This is the main page of the app

// Importing components
import CreateSeedListingModal from "@/components/CreateSeedListingModal"; // Modal to create a new seed listing
import SeedListingList from "@/components/SeedListingList"; // Component to display the list of seed listings

export default function Home() {
  return (
    <div>
      {/* Render the modal for creating a new seed listing */}
      <CreateSeedListingModal />

      {/* Render the list of existing seed listings */}
      <SeedListingList />
    </div>
  );
}
