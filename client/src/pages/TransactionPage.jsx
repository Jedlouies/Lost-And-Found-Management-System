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
           
            {selectedMatch?.lostItem ? (
              <div className='itemLostTransaction'>
                 <h2>Lost Item</h2>
                <img src={selectedMatch.lostItem.images} alt="img" style={{width: '250px', height: '250px', borderRadius: '10px', objectFit: 'cover'}}/>
                <p style={{fontSize: '30px', fontWeight: 'bolder'}}> {selectedMatch.lostItem.itemName}</p>
                <span style={{fontSize: '10px'}}>Item ID Number: {selectedMatch.lostItem.itemId}</span>
                <div style={{width: '70%', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#F0F0F0', padding: '10px', borderRadius: '10px'}}> 
                  <img src={selectedMatch.lostItem.personalInfo?.profileURL} alt=""  style={{width: '50px', height: '50px', borderRadius: '30px', objectFit: 'cover'}}/>
                  <div style={{display: 'flex', flexDirection: 'column', height: '90%'}}>
                    <span style={{fontSize: '15px', fontWeight: 'bold'}}>{selectedMatch.lostItem.personalInfo?.firstName} {selectedMatch.lostItem.personalInfo?.lastName}</span>
                    <span style={{fontSize: '15px'}}>{selectedMatch.lostItem.personalInfo.course}</span>
                    
                  </div>
                  
                </div>
                <div className='item-transaction-details'>
                  <div>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>Date Lost:</strong> {selectedMatch.lostItem.dateLost}</p>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>Category:</strong> {selectedMatch.lostItem.category}</p>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>Location Lost:</strong> {selectedMatch.lostItem.locationLost}</p>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>Claim Status:</strong> {selectedMatch.lostItem.claimStatus}</p>

                  </div>
                  <div>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>Description:</strong> {selectedMatch.lostItem.itemDescription}</p>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>How item lost:</strong> {selectedMatch.lostItem.howItemLost}</p>
                  </div>
                </div>         
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
                <img src={selectedMatch.foundItem.images} alt="img" style={{width: '250px', height: '250px', borderRadius: '10px', objectFit: 'cover'}}/>
                <p style={{fontSize: '30px', fontWeight: 'bolder'}}> {selectedMatch.foundItem.itemName}</p>
                <span style={{fontSize: '10px'}}>Item ID Number: {selectedMatch.foundItem.itemId}</span>
                <div style={{width: '70%', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#F0F0F0', padding: '10px', borderRadius: '10px'}}> 
                  <img src={selectedMatch.foundItem.personalInfo?.profileURL} alt=""  style={{width: '50px', height: '50px', borderRadius: '30px', objectFit: 'cover'}}/>
                  <div style={{display: 'flex', flexDirection: 'column', height: '90%'}}>
                    <span style={{fontSize: '15px', fontWeight: 'bold'}}>{selectedMatch.foundItem.personalInfo?.firstName} {selectedMatch.foundItem.personalInfo?.lastName}</span>
                    <span style={{fontSize: '15px'}}>{selectedMatch.foundItem.personalInfo.course}</span>
                    
                  </div>
                  
                </div>
                <div className='item-transaction-details'>
                  <div>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>Date Found:</strong> {selectedMatch.foundItem.dateFound}</p>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>Category:</strong> {selectedMatch.foundItem.category}</p>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>Location Found:</strong> {selectedMatch.foundItem.locationFound}</p>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>Claim Status:</strong> {selectedMatch.foundItem.claimStatus}</p>

                  </div>
                  <div>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>Description:</strong> {selectedMatch.foundItem.itemDescription}</p>
                    <p style={{fontSize: '12px', marginLeft: '10px'}}> <strong>How item found:</strong> {selectedMatch.foundItem.howItemFound}</p>
                  </div>
                </div>         
              </div>
            ) : (
              <p>No found item details</p>
            )}
          </div>
          <button style={{position: 'absolute', top: '92%', left: '75%', width: '200px', height: '40px', borderRadius: '20px', border: '2px solid #475C6F', backgroundColor: 'transparent', color: '#475C6F', gap: '10px'}}>Process 
             <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-forward" viewBox="0 0 16 16">
              <path d="M9.502 5.513a.144.144 0 0 0-.202.134V6.65a.5.5 0 0 1-.5.5H2.5v2.9h6.3a.5.5 0 0 1 .5.5v1.003c0 .108.11.176.202.134l3.984-2.933.042-.028a.147.147 0 0 0 0-.252l-.042-.028zM8.3 5.647a1.144 1.144 0 0 1 1.767-.96l3.994 2.94a1.147 1.147 0 0 1 0 1.946l-3.994 2.94a1.144 1.144 0 0 1-1.767-.96v-.503H2a.5.5 0 0 1-.5-.5v-3.9a.5.5 0 0 1 .5-.5h6.3z"/>
            </svg>
          </button>
        </div>
        
      </>
    );
  }

  export default TransactionPage;
