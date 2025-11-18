import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from "firebase/firestore";
import './styles/WeeklyUsersCard.css'

const WeeklyUsersCard = () => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const categories = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getStartOfWeek = () => {
    const now = new Date();
    const day = now.getDay(); 
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  };

  useEffect(() => {
    const startOfWeek = getStartOfWeek();

    const q = query(
      collection(db, "users"),
      where("createdAt", ">=", startOfWeek)
    );

    const unsub = onSnapshot(q, (snap) => {
      const weeklyCounts = Array(7).fill(0);

      snap.forEach(doc => {
        const data = doc.data();
        if (data.createdAt) {
          const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          const day = date.getDay();
          weeklyCounts[day]++;
        }
      });

      const orderedCounts = [...weeklyCounts.slice(1), weeklyCounts[0]];

      setSeries([
        {
          name: 'New Accounts',
          data: orderedCounts,
        }
      ]);

      setLoading(false); // Data fetched, stop loading
    });

    return () => unsub();
  }, []);

  const options = {
    chart: {
      height: 200,
      type: 'line',
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: "top",
      labels: {
        colors: ["#6B7280"],
        useSeriesColors: false,
      }
    },
    stroke: {
      curve: 'straight',
      colors: ['#475C6F'],
    },
    grid: {
      row: {
        colors: ['#f3f3f3', 'transparent'],
        opacity: 0.5,
      },
    },
    xaxis: {
      categories: categories,
    },
  };

  return (
    <div id="chart" className='chart' style={{width: '60%'}}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <img src="/Spin_black.gif" alt="Loading..." style={{ width: '40px', height: '40px' }} />
        </div>
      ) : (
        <ReactApexChart options={options} series={series} type="line" height={'300'} />
      )}
    </div>
  );
};

export default WeeklyUsersCard;
