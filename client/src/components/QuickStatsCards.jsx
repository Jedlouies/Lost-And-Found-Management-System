import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

// --- Circular Progress Component (Internal) ---
const CircularProgress = ({ value, color, label, suffix = "%" }) => {
    const radius = 30;
    const stroke = 6;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    
    // For visual representation, cap at 100.
    const isPercentage = suffix === "%";
    const visualValue = isPercentage ? (value > 100 ? 100 : value) : 100;
    
    const strokeDashoffset = circumference - (visualValue / 100) * circumference;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
                {/* Background Circle */}
                <svg
                    height={radius * 2}
                    width={radius * 2}
                    style={{ transform: 'rotate(-90deg)' }}
                >
                    <circle
                        stroke="#e6e6e6"
                        strokeWidth={stroke}
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    {/* Foreground Progress Circle */}
                    <circle
                        stroke={color}
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                        strokeLinecap="round"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </svg>
                {/* Center Text */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#333'
                }}>
                    {value}{suffix}
                </div>
            </div>
            {label && <span style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>{label}</span>}
        </div>
    );
};

const QuickStatsCards = () => {
    const [stats, setStats] = useState({
        lost: 0,
        found: 0,
        claimed: 0,
        users: 0,
        claimRate: 0,
        foundShare: 0, // Percentage of total reports that are found
        lostShare: 0   // Percentage of total reports that are lost
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const lostSnap = await getDocs(collection(db, "lostItems"));
                const lostCount = lostSnap.size;

                const foundSnap = await getDocs(collection(db, "foundItems"));
                const foundCount = foundSnap.size;

                const claimedQuery = query(collection(db, "foundItems"), where("claimStatus", "==", "claimed"));
                const claimedSnap = await getDocs(claimedQuery);
                const claimedCount = claimedSnap.size;

                const usersSnap = await getDocs(collection(db, "users"));
                const usersCount = usersSnap.size;

                const totalReports = foundCount + lostCount;

                const cRate = foundCount > 0 ? Math.round((claimedCount / foundCount) * 100) : 0;

                const fShare = totalReports > 0 ? Math.round((foundCount / totalReports) * 100) : 0;

                const lShare = totalReports > 0 ? Math.round((lostCount / totalReports) * 100) : 0;

                setStats({
                    lost: lostCount,
                    found: foundCount,
                    claimed: claimedCount,
                    users: usersCount,
                    claimRate: cRate,
                    foundShare: fShare,
                    lostShare: lShare
                });

            } catch (error) {
                console.error("Error fetching quick stats:", error);
            }
        };

        fetchStats();
    }, []);

    const styles = {
        container: {
            display: 'contents', // Allows grid from parent to control layout
        },
        card: {
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderLeft: '5px solid', // Color set dynamically
        },
        textGroup: {
            display: 'flex',
            flexDirection: 'column',
        },
        title: {
            fontSize: '0.85rem', 
            color: '#6c757d',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: '600'
        },
        value: {
            fontSize: '1.8rem',
            fontWeight: 'bold',
            color: '#333',
            margin: '5px 0 0 0',
        },
        subText: {
            fontSize: '0.75rem',
            color: '#888',
            marginTop: '2px'
        }
    };

    return (
        <div style={styles.container}>
            
            <div style={{ ...styles.card, borderLeftColor: '#6f42c1' }}>
                <div style={styles.textGroup}>
                    <h5 style={styles.title}>Registered Users</h5>
                    <h2 style={styles.value}>{stats.users}</h2>
                    <span style={styles.subText}>Total Accounts</span>
                </div>
                <div style={{ opacity: 0.8 }}>
                    <CircularProgress value={stats.users} color="#6f42c1" suffix="" /> 
                </div>
            </div>

            <div style={{ ...styles.card, borderLeftColor: '#28a745' }}>
                <div style={styles.textGroup}>
                    <h5 style={styles.title}>Total Found</h5>
                    <h2 style={styles.value}>{stats.found}</h2>
                    <span style={styles.subText}>Items Posted</span>
                </div>
                <div style={{ opacity: 0.8 }}>
                     <CircularProgress value={stats.foundShare} color="#28a745" suffix="%" />
                </div>
            </div>

            <div style={{ ...styles.card, borderLeftColor: '#dc3545' }}>
                <div style={styles.textGroup}>
                    <h5 style={styles.title}>Total Lost</h5>
                    <h2 style={styles.value}>{stats.lost}</h2>
                    <span style={styles.subText}>Items Reported</span>
                </div>
                <div style={{ opacity: 0.8 }}>
                    <CircularProgress value={stats.lostShare} color="#dc3545" suffix="%" /> 
                </div>
            </div>

            <div style={{ ...styles.card, borderLeftColor: '#007bff' }}>
                <div style={styles.textGroup}>
                    <h5 style={styles.title}>Claim Rate</h5>
                    <h2 style={styles.value}>{stats.claimRate}%</h2>
                    <span style={styles.subText}>{stats.claimed} / {stats.found} Items</span>
                </div>
                <div style={{ opacity: 1 }}>
                    <CircularProgress value={stats.claimRate} color="#007bff" />
                </div>
            </div>

        </div>
    );
};

export default QuickStatsCards;