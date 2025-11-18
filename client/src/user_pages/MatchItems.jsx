import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const ProgressBar = ({ value }) => {
  const percentage = Math.min(Math.max(value, 0), 100); 
  let color = "bg-red-500";
  if (percentage >= 70) color = "bg-green-500";
  else if (percentage >= 40) color = "bg-yellow-500";

  return (
    <div className="w-full bg-gray-200 rounded h-4 overflow-hidden">
      <div
        className={`${color} h-4 transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

export default function MatchItems() {
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [selectedLost, setSelectedLost] = useState("");
  const [selectedFound, setSelectedFound] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch items from Firestore
  useEffect(() => {
    const fetchData = async () => {
      const lostSnap = await getDocs(collection(db, "lostItems"));
      const foundSnap = await getDocs(collection(db, "foundItems"));
      setLostItems(lostSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setFoundItems(foundSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchData();
  }, []);

  // Compare lost and found items
  const handleCompare = async () => {
    if (!selectedLost || !selectedFound) {
      alert("Please select both lost and found items.");
      return;
    }
    await fetchMatch("http://localhost:4000/api/match", {
      uidLost: selectedLost,
      uidFound: selectedFound,
    });
  };

  const handleFoundToLost = async () => {
    if (!selectedFound) {
      alert("Please select a found item.");
      return;
    }
    await fetchMatch("http://localhost:4000/api/match/found-to-lost", {
      uidFound: selectedFound,
    });
  };

  const handleLostToFound = async () => {
    if (!selectedLost) {
      alert("Please select a lost item.");
      return;
    }
    await fetchMatch("http://localhost:4000/api/match/lost-to-found", {
      uidLost: selectedLost,
    });
  };

  const fetchMatch = async (url, body) => {
    setLoading(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Unknown error");
      }

      const result = await response.json();
      console.log("Match API result:", result);
      setMatchResult(result);
    } catch (error) {
      console.error(error);
      alert("Error comparing items: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderMatch = (match, index) => (
    <div key={index} className="p-4 border rounded bg-gray-50 mb-4">
      <h3 className="font-semibold mb-2">
        {match.lostId ? `Lost Item: ${match.lostId}` : `Found Item: ${match.foundId}`}
      </h3>
      <div className="text-sm space-y-2" style={{ color: "black" }}>
        <p style={{ color: "black" }}><strong>Name:</strong> {match.nameScore}%</p>
        <ProgressBar value={match.nameScore} />
        <p style={{ color: "black" }}><strong>Description:</strong> {match.descriptionScore}%</p>
        <ProgressBar value={match.descriptionScore} />
        <p style={{ color: "black" }}><strong>Location:</strong> {match.locationScore}%</p>
        <ProgressBar value={match.locationScore} />
        <p style={{ color: "black" }}><strong>Category:</strong> {match.categoryScore}%</p>
        <ProgressBar value={match.categoryScore} />
        <p style={{ color: "black" }}><strong>Overall:</strong> {match.overallScore}%</p>
        <ProgressBar value={match.overallScore} />
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Compare Lost and Found Items</h1>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h2 className="font-semibold mb-2">Select Lost Item</h2>
          <select
            className="border p-2 w-full"
            value={selectedLost}
            onChange={(e) => setSelectedLost(e.target.value)}
          >
            <option value="">-- Select Lost Item --</option>
            {lostItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.itemName || item.id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Select Found Item</h2>
          <select
            className="border p-2 w-full"
            value={selectedFound}
            onChange={(e) => setSelectedFound(e.target.value)}
          >
            <option value="">-- Select Found Item --</option>
            {foundItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.itemName || item.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleCompare}
          disabled={loading}
        >
          {loading ? "Comparing..." : "Compare Items"}
        </button>

        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={handleFoundToLost}
          disabled={loading}
        >
          {loading ? "Testing..." : "Found → Lost (Top 4)"}
        </button>

        <button
          className="bg-purple-600 text-white px-4 py-2 rounded"
          onClick={handleLostToFound}
          disabled={loading}
        >
          {loading ? "Testing..." : "Lost → Found (Top 4)"}
        </button>
      </div>

      {matchResult && Array.isArray(matchResult) && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Top Matches</h2>
          {matchResult.map((match, index) => renderMatch(match, index))}
        </div>
      )}

      {matchResult && !Array.isArray(matchResult) && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">Match Result</h2>
          {renderMatch(matchResult, 0)}
        </div>
      )}
    </div>
  );
}
