// QuickStatsCards.jsx
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const styles = {
    // NOTE: Styles remain the same for now, but remember CSS files are better for production
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    value: {
        fontSize: '2rem',
        fontWeight: '700',
        color: '#475C6F',
    },
    label: {
        fontSize: '0.9rem',
        color: '#555',
    }
};

const QuickStatsCards = () => {
    const [stats, setStats] = useState({
        totalFound: 0,
        totalClaimed: 0,
        totalLost: 0, // <--- NEW STATE ADDED
        totalUsers: 0, 
        claimRate: '0.00%',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                // Fetch all collections counts in parallel
                const [foundSnap, lostSnap, userSnap] = await Promise.all([
                    getDocs(collection(db, 'foundItems')),
                    getDocs(collection(db, 'lostItems')),
                    getDocs(collection(db, 'users')),
                ]);

                const totalFound = foundSnap.size;
                const totalLost = lostSnap.size; // <--- FETCH TOTAL LOST
                const totalUsers = userSnap.size;
                
                let totalClaimed = 0;
                lostSnap.forEach(doc => {
                    if (doc.data().claimStatus === 'claimed') {
                        totalClaimed++;
                    }
                });

                // Calculate Claim Rate: Claimed / (Total Lost + Total Found) * 100
                const totalItemsTracked = totalFound + totalLost; 

                const claimRate = totalItemsTracked > 0 
                    ? ((totalClaimed / totalItemsTracked) * 100).toFixed(2)
                    : '0.00';
                
                setStats({
                    totalFound,
                    totalClaimed,
                    totalLost, // <--- ADDED TO STATE
                    totalUsers,
                    claimRate: `${claimRate}%`,
                });

            } catch (error) {
                console.error("Error fetching quick stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 24 * 60 * 60 * 1000); 
        return () => clearInterval(interval);

    }, []);

    const statData = [
        { label: "Total Items Found", value: stats.totalFound },
        { label: "Total Items Lost", value: stats.totalLost }, // <--- NEW CARD POSITION
        { label: "Total Items Claimed", value: stats.totalClaimed },
        { label: "Total Registered Users", value: stats.totalUsers },
        { label: "Overall Claim Rate", value: stats.claimRate },
    ];

    return (
        <>
            {loading ? (
                <div style={{...styles.card, gridColumn: '1 / -1', height: '100px', display: 'flex', alignItems: 'center', justifyContent:'center'}}>
                    <img src="/Spin_black.gif" alt="Loading..." style={{ width: '30px', height: '30px' }} />
                    <span style={{marginLeft: '10px', color: '#555'}}>Loading Quick Stats...</span>
                </div>
            ) : (
                statData.map((stat, index) => (
                    <div key={index} style={styles.card}>
                        <span style={styles.value}>{stat.value}</span>
                        <span style={styles.label}>{stat.label}</span>
                    </div>
                ))
            )}
        </>
    );
};

export default QuickStatsCards;