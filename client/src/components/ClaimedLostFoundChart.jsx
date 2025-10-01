import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import "./styles/ClaimedLostFound.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function ClaimedLostFoundChart() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true); // added loading state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // helper: count by month
  const getMonthlyCounts = (items, type = "found", year = new Date().getFullYear()) => {
    const counts = Array(12).fill(0);

    items.forEach((item) => {
      let date = null;

      if (type === "found" && item.dateFound) {
        date = item.dateFound.toDate ? item.dateFound.toDate() : new Date(item.dateFound);
      }
      if (type === "lost" && item.dateLost) {
        date = item.dateLost.toDate ? item.dateLost.toDate() : new Date(item.dateLost);
      }

      if (date && date.getFullYear() === year) {
        const month = date.getMonth();
        counts[month]++;
      }
    });

    return counts.map((count, i) => ({
      x: new Date(year, i).toLocaleString("default", { month: "short" }),
      y: count,
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // start loading

        // Found Items
        const foundSnap = await getDocs(collection(db, "foundItems"));
        const foundItems = foundSnap.docs.map((doc) => doc.data());

        // Lost Items
        const lostSnap = await getDocs(collection(db, "lostItems"));
        const lostItems = lostSnap.docs.map((doc) => doc.data());

        // Claimed (from lost items)
        const claimedItems = lostItems.filter(
          (item) => item.claimStatus === "claimed"
        );

        setSeries([
          {
            name: "Item Claimed",
            color: "#9EBAD6",
            data: getMonthlyCounts(claimedItems, "lost"),
          },
          {
            name: "Lost Items",
            color: "#384959",
            data: getMonthlyCounts(lostItems, "lost"),
          },
          {
            name: "Found Items",
            color: "#88BDF1",
            data: getMonthlyCounts(foundItems, "found"),
          },
        ]);

        setLoading(false); // finish loading
      } catch (err) {
        console.error("Error fetching chart data:", err);
        setLoading(false); // stop loading even if error
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 24 * 60 * 60 * 1000); // refresh every 24h
    return () => clearInterval(interval);
  }, []);

  const options = {
    colors: ["#1A56DB", "#F43F5E", "#10B981"],
    chart: {
      type: "bar",
      fontFamily: "Inter, sans-serif",
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
        },
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "60%",
        borderRadiusApplication: "end",
        borderRadius: 2,
      },
    },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: "top",
    },
    xaxis: {
      type: "category",
      labels: { show: true },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { show: true },
    fill: { opacity: 1 },
  };

  return (
    <div className="body" style={{ position: "relative", height: "300px" }}>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <img src="/Spin_black.gif" alt="Loading..." style={{ width: "40px", height: "40px" }} />
        </div>
      ) : (
        <Chart options={options} series={series} type="bar" height="100%" />
      )}
    </div>
  );
}

export default ClaimedLostFoundChart;
