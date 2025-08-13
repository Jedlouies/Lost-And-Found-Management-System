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
          <div style={{ position: 'relative', width: '1400px', top: '-30%', left: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
           
            {selectedMatch?.lostItem ? (
              <div className='itemLostTransaction'>
                 <h2>Lost Item</h2>
                <img src={selectedMatch.lostItem.images} alt="img" style={{width: '300px', height: '300px', borderRadius: '10px', objectFit: 'cover'}}/>
                <p style={{fontSize: '30px', fontWeight: 'bolder'}}> {selectedMatch.lostItem.itemName}</p>
                <p><strong>Description:</strong> {selectedMatch.lostItem.itemDescription}</p>
                
              </div>
            ) : (
              <p>No lost item details</p>
            )}

            <div className='transactionScores'>
              <h4>Results</h4>
              <div className='scoreResults'>
              <span style={{ fontSize: '15px', color: 'black'}}>
                Image Rate:  
                {selectedMatch?.scores?.imageScore != null
                  ? ` ${Math.round(selectedMatch.scores.imageScore)}%`
                  : 'N/A'}
              </span>
              <div className='progress-bar-full' style={{marginTop: '5px'}}>
                <div
                  className="progress-bar-percentage"
                  style={{
                    width: selectedMatch?.scores?.imageScore != null
                      ? `${selectedMatch.scores.imageScore}%`
                      : '0%'
                  }}
                ></div>
              </div>

              <span style={{ fontSize: '15px', color: 'black'}}>
                Description Rate:  
                {selectedMatch?.scores?.descriptionScore != null
                  ? ` ${Math.round(selectedMatch.scores.descriptionScore)}%`
                  : 'N/A'}
              </span>
              <div className='progress-bar-full' style={{marginTop: '5px'}}>
                <div
                  className="progress-bar-percentage"
                  style={{
                    width: selectedMatch?.scores?.descriptionScore != null
                      ? `${selectedMatch.scores.descriptionScore}%`
                      : '0%'
                  }}
                ></div>
              </div>

               <span style={{ fontSize: '15px', color: 'black'}}>
                Name Rate:  
                {selectedMatch?.scores?.nameScore != null
                  ? ` ${Math.round(selectedMatch.scores.nameScore)}%`
                  : 'N/A'}
              </span>
              <div className='progress-bar-full' style={{marginTop: '5px'}}>
                <div
                  className="progress-bar-percentage"
                  style={{
                    width: selectedMatch?.scores?.nameScore != null
                      ? `${selectedMatch.scores.nameScore}%`
                      : '0%'
                  }}
                ></div>
              </div>

              <span style={{ fontSize: '15px', color: 'black'}}>
                Location Rate:  
                {selectedMatch?.scores?.locationScore != null
                  ? ` ${Math.round(selectedMatch.scores.locationScore)}%`
                  : 'N/A'}
              </span>
              <div className='progress-bar-full' style={{marginTop: '5px'}}>
                <div
                  className="progress-bar-percentage"
                  style={{
                    width: selectedMatch?.scores?.locationScore != null
                      ? `${selectedMatch.scores.locationScore}%`
                      : '0%'
                  }}
                ></div>
              </div>

              <span style={{ fontSize: '15px', color: 'black'}}>
                Category Rate:  
                {selectedMatch?.scores?.categoryScore != null
                  ? ` ${Math.round(selectedMatch.scores.categoryScore)}%`
                  : 'N/A'}
              </span>
              <div className='progress-bar-full' style={{marginTop: '5px'}}>
                <div
                  className="progress-bar-percentage"
                  style={{
                    width: selectedMatch?.scores?.categoryScore != null
                      ? `${selectedMatch.scores.categoryScore}%`
                      : '0%'
                  }}
                ></div>
              </div>
              

              <span style={{ fontSize: '15px', color: 'black'}}>
                Overall Rate:  
                {selectedMatch?.scores?.overallScore != null
                  ? ` ${Math.round(selectedMatch.scores.overallScore)}%`
                  : 'N/A'}
              </span>
              <div className='progress-bar-full' style={{marginTop: '5px'}}>
                <div
                  className="progress-bar-percentage"
                  style={{
                    width: selectedMatch?.scores?.overallScore != null
                      ? `${selectedMatch.scores.overallScore}%`
                      : '0%'
                  }}
                ></div>
              </div>

              </div>
            </div>


            
            {selectedMatch?.foundItem ? (
              <div className='itemFoundTransaction'>
                <h2>Found Item</h2>
                <img src={selectedMatch.foundItem.images} alt="img" style={{width: '300px', height: '300px', borderRadius: '10px', objectFit: 'cover'}}/>
                <p style={{fontSize: '30px', fontWeight: 'bolder'}}> {selectedMatch.foundItem.itemName}</p>
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
