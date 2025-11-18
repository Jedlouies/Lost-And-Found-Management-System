import React, { useState, useEffect } from "react";
import NavigationBar from "../components/NavigationBar";
import TablesHeader from "../components/TablesHeader";
import "./styles/FoundItemPage.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  query,
  where
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function ArchivedFoundItemsPage() {
  const [items, setItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const itemsPerPage = 6;
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, "foundItems"),
      where("archivedStatus", "==", true) 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const archivedItems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(archivedItems);
    });

    return () => unsubscribe();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.itemName
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    const itemDate = item.dateFound
      ? new Date(item.dateFound)
      : item.createdAt?.toDate
      ? item.createdAt.toDate()
      : null;

    const matchesYear =
      selectedYear === "" ||
      (itemDate && itemDate.getFullYear().toString() === selectedYear);

    return matchesSearch && matchesYear;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const displayedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <NavigationBar />
      <div className="found-item-body">
        <TablesHeader />
        <div className="found-item-container" style={{ position: "absolute", top: "80px" }}>
          <h1>Archived Found Items</h1>

          {/* Search Bar */}
          <div className="searchBar2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="#475C6F"
              className="bi bi-search"
              viewBox="0 0 16 16"
            >
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
            </svg>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Table */}
          <div>
            <table className="found-item-table" style={{ marginTop: "30px" }}>
              <thead>
                <tr>
                  <th style={{ minWidth: "180px" }}>Item ID No.</th>
                  <th style={{ minWidth: "110px" }}>Image</th>
                  <th style={{ minWidth: "100px" }}>Name</th>
                  <th>Date Found</th>
                  <th>Location Found</th>
                  <th>Founder</th>
                  <th>Owner</th>
                  <th>Claim Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedItems.length > 0 ? (
                  displayedItems.map((item, index) => (
                    <tr className="body-row" key={index}>
                      <td>{item.itemId}</td>
                      <td>
                        {item.images && item.images.length > 0 ? (
                          <img
                            src={item.images[0]}
                            alt={item.itemName}
                            style={{
                              width: "50px",
                              height: "50px",
                              borderRadius: "40px",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          "No Image"
                        )}
                      </td>
                      <td>{item.itemName}</td>
                      <td>
                        {item.dateFound
                          ? new Date(item.dateFound).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>{item.locationFound || "N/A"}</td>
                      <td>
                        <div className="founder-details">
                          {item.personalInfo?.profileURL ? (
                            <img
                              src={item.personalInfo?.profileURL}
                              alt="Founder"
                              style={{
                                width: "50px",
                                height: "50px",
                                borderRadius: "40px",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            "Unknown"
                          )}
                          <div className="personal-info">
                            <p style={{ fontSize: "13px", fontWeight: "bold", color: "black" }}>
                              {item.personalInfo?.firstName}{" "}
                              {item.personalInfo?.lastName}
                            </p>
                            <p style={{ fontStyle: "italic", color: "black" }}>
                              {item.personalInfo?.course?.abbr || "Unknown"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="owner-details">
                          {item.claimedBy ? (
                            <>
                              {item.claimedBy.profileURL ? (
                                <img
                                  src={item.claimedBy.profileURL}
                                  alt="Owner"
                                  style={{
                                    width: "50px",
                                    height: "50px",
                                    borderRadius: "40px",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                "No Image"
                              )}
                              <div className="personal-info">
                                <p
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: "bold",
                                    color: "black",
                                  }}
                                >
                                  {item.claimedBy.firstName}{" "}
                                  {item.claimedBy.lastName}
                                </p>
                                <p
                                  style={{
                                    fontStyle: "italic",
                                    color: "black",
                                  }}
                                >
                                  {item.claimedBy.course?.abbr || "Unknown"}
                                </p>
                              </div>
                            </>
                          ) : (
                            <p style={{color: 'black'}}>Unknown</p>
                          )}
                        </div>
                      </td>
                      <td>{item.claimStatus || "unclaimed"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center" }}>
                      No archived found items.
                    </td>
                  </tr>
                )}
              </tbody>

              <tfoot>
                <tr className="footer">
                  <td colSpan="8" style={{ textAlign: "center", padding: "10px 0" }}>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      {"<"}
                    </button>
                    {[...Array(totalPages)].map((_, i) => i + 1)
                      .filter((pageNum) => {
                        if (totalPages <= 3) return true;
                        if (currentPage === 1) return pageNum <= 3;
                        if (currentPage === totalPages) return pageNum >= totalPages - 2;
                        return Math.abs(currentPage - pageNum) <= 1;
                      })
                      .map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          style={{
                            fontWeight: currentPage === pageNum ? "bold" : "normal",
                            margin: "0 5px",
                          }}
                        >
                          {pageNum}
                        </button>
                      ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      {">"}
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default ArchivedFoundItemsPage;
