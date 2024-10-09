import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image"; // For handling image imports
import { useDebounce } from "use-debounce"; // For debouncing input
import { toast } from "react-toastify"; // For displaying toast notifications
import { useContractSend } from "@/hooks/contracts/useContractWrite"; // For sending data to a smart contract
import { useContractCall } from "@/hooks/contracts/useContractRead"; // For reading data from a smart contract
import Link from "next/link"; // For creating links
import { identiconTemplate } from "@/helpers"; // Helper to generate identicons

// Define the Comment interface structure
interface Comment {
  id: number;
  userAddress: string;
  timestamp: string;
  comment: string;
}

// Initial empty array of comments
const initialComments: Comment[] = [];

// Component to display an individual comment
const CommentItem = ({ comment }: { comment: Comment }) => {
  return (
    <div className="flex items-start py-3 border-b border-gray-300">
      {/* User Avatar with Identicon */}
      <Link
        href={`https://explorer.celo.org/alfajores/address/${comment.userAddress}`}
        className="flex-shrink-0 h-10 w-10 rounded-full" // Display the user's identicon avatar
        style={{ fontSize: "12px" }}
      >
        {identiconTemplate(comment.userAddress)}
      </Link>

      {/* Comment details */}
      <div className="ml-5">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500" style={{ fontSize: "11px" }}>
            {comment.timestamp} {/* Display the comment timestamp */}
          </p>
        </div>
        <p className="mt-2 text-gray-700" style={{ fontSize: "12px" }}>
          {comment.comment} {/* Display the comment text */}
        </p>
      </div>
    </div>
  );
};

// Main Comment Section component
const CommentSection = ({ id }: any) => {
  // State for comments and new comment input
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [debouncedNewComment] = useDebounce(newComment, 500); // Debounced new comment input

  const [loading, setLoading] = useState(""); // Loading state for form submission

  // Check if new comment input is filled
  const isComplete = newComment.length > 0;

  // Clear the comment input field after submission
  const clearForm = () => {
    setNewComment("");
  };

  // Hook to write a new comment to the blockchain via the smart contract
  const { writeAsync: addComment } = useContractSend("addComment", [
    id,
    debouncedNewComment,
  ]);

  // Function to handle adding a new comment
  const handleAddComment = async () => {
    if (!addComment) {
      throw new Error("Failed to add comment");
    }
    setLoading("Submitting...");
    if (!isComplete) throw new Error("Please fill out the comment");

    // Send the new comment to the blockchain
    const createCommentTx = await addComment();
    setLoading("Waiting for confirmation...");
    await createCommentTx.wait();

    // Clear the form and update UI
    clearForm();
  };

  // Form submission handler
  const submitComment = async (e: any) => {
    e.preventDefault();
    try {
      await toast.promise(handleAddComment(), {
        pending: "Submitting comment...",
        success: "Comment added successfully",
        error: "Failed to add comment. Please try again.",
      });
    } catch (error: any) {
      console.error({ error });
      toast.error(error?.message || "Failed to add comment. Please try again.");
    } finally {
      setLoading("");
    }
  };

  // Hook to read comments data from the smart contract
  const { data: commentData } = useContractCall("getComments", [id], true);

  // Function to format and set the retrieved comments
  const fetchComments = useCallback(() => {
    // Ensure data is present and in array format
    if (!Array.isArray(commentData)) return;

    // Map and format comments from the contract data
    const formattedComments: Comment[] = commentData.map(
      (item: any, index: number) => ({
        id: index + 1, // Create a unique ID for each comment
        userAddress: item[0], // Address of the commenter
        timestamp: new Date(item[2].toNumber() * 1000).toLocaleString(), // Convert timestamp to readable format
        comment: item[1], // The comment content
      })
    );

    // Update state with the formatted comments
    setComments(formattedComments);
  }, [commentData]);

  // Fetch comments when the component mounts or data changes
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return (
    <div className="bg-white p-4 rounded-lg">
      <h3 className="text-lg font-medium mb-4">Comments</h3>

      {/* Render the list of comments */}
      <div className="mb-4">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>

      {/* Input field to add a new comment */}
      <form onSubmit={submitComment} className="flex flex-col space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="border rounded-lg p-2"
          rows={3}
        ></textarea>
        <button
          type="submit"
          className="bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
          disabled={!!loading}
        >
          {loading ? loading : "Add Comment"}
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
