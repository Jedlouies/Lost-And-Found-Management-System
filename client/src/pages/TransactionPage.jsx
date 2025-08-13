import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import NavigationBar from '../components/NavigationBar';
import './styles/TransactionPage.css';
import { useNavigate } from 'react-router-dom';
import { getAuth } from "firebase/auth";
import BlankHeader from '../components/BlankHeader';

function TransactionPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const matchesRef = collection(db, 'matches');
        const snapShot = await getDocs(matchesRef);
        const results = snapShot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(match =>
            match.transactionId?.toLowerCase().includes(searchQuery.toLowerCase())
          );

        setSearchResults(results);
        setShowDropdown(true);

      } catch (error) {
        console.error("Error fetching matches:", error);
      }
    };
    fetchMatches();
  }, [searchQuery]);

  const handleSelectMatch = async (matchId) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      const matchSnap = await getDoc(matchRef);
      if (matchSnap.exists()) {
        setSelectedMatch({ id: matchSnap.id, ...matchSnap.data() });
      }
      setShowDropdown(false);
    } catch (error) {
      console.error("Error fetching selected match:", error);
    }
  };

  return (
    <>
      <NavigationBar />
      <div className='transaction-body'>
        <BlankHeader />
        <div style={{ position: 'relative', width: '1400px', top: '-40%', left: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
          </svg>
          <input
            type="text"
            placeholder="Search by Transaction ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            style={{ width: '100%', padding: '8px', borderRadius: '10px', border: '2px solid #475C6F', backgroundColor: 'transparent', color: '#475C6F', fontSize: '16px' }}
          />
          {showDropdown && searchResults.length > 0 && (
            <ul
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '100%',
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 10,
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}
            >
              {searchResults.map(result => (
                <li
                  key={result.id}
                  style={{
                    padding: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => {
                    setSearchQuery(result.transactionId || '');
                    handleSelectMatch(result.id);
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#888' }}>
                    {result.transactionId}
                  </span>
                  <span>{result.createAt}</span>
                  <span style={{ fontSize: '12px', color: '#888' }}>
                    Score: {result.scores?.overallScore ?? 'N/A'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className='transaction-content'>
          <h4>Lost Item</h4>
          {selectedMatch?.lostItem ? (
            <div>
              <img src={selectedMatch.lostItem.images} alt="img" style={{width: '200px', height: '200px', borderRadius: '10px', objectFit: 'cover'}}/>
              <p><strong>Name:</strong> {selectedMatch.lostItem.itemName}</p>
              <p><strong>Description:</strong> {selectedMatch.lostItem.itemDescription}</p>
              
              {/* Add other lostItem fields */}
            </div>
          ) : (
            <p>No lost item details</p>
          )}

          <h4>Found Item</h4>
          {selectedMatch?.foundItem ? (
            <div>
              <img src={selectedMatch.foundItem.images} alt="img" style={{width: '200px', height: '200px', borderRadius: '10px', objectFit: 'cover'}}/>
              <p><strong>Name:</strong> {selectedMatch.foundItem.itemName}</p>
              <p><strong>Description:</strong> {selectedMatch.foundItem.itemDescription}</p>
              {/* Add other foundItem fields */}
            </div>
          ) : (
            <p>No found item details</p>
          )}
        </div>
      </div>
    </>
  );
}

export default TransactionPage;
