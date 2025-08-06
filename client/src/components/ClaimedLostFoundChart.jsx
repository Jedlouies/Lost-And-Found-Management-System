import React from 'react';
import Chart from 'react-apexcharts';
import './styles/ClaimedLostFound.css';

function ClaimedLostFoundChart() {
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
        customIcons: [],
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
    tooltip: {
      shared: true,
      intersect: false,
      style: { fontFamily: "Inter, sans-serif"},
    },
    states: {
      hover: { filter: { type: "darken", value: 1 } },
    },
    stroke: {
      show: true,
      width: 0,
      colors: ["transparent"],
    },
    grid: {
      show: true,
      strokeDashArray: 4,
      padding: { left: 10, right: 2, top: -14 },
      borderColor: 'gray', 
    },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: "top",
      
      borderRadius: "80px",
      labels: {
        colors: ["#6B7280"],
        useSeriesColors: false,
      },
    },
    xaxis: {
      type: "category",
      labels: {
        show: true,
        style: {
          fontFamily: "Inter, sans-serif",
          cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400',
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { show: true },
    fill: { opacity: 1 },
  };

  const series = [
    {
      name: "Item Claimed",
      color: "#9EBAD6",
      data: [
        { x: "Jan", y: 100 },
        { x: "Feb", y: 150 },
        { x: "March", y: 180 },
        { x: "April", y: 320 },
        { x: "May", y: 230 },
        { x: "June", y: 190 },
        { x: "July", y: 120 },
        { x: "Aug", y: 330 },
        { x: "Sept", y: 140 },
        { x: "Oct", y: 120 },
        { x: "Nov", y: 310 },
        { x: "Dec", y: 170 },
      ],
    },
    {
      name: "Lost Items",
      color: "#384959",
      data: [
        { x: "Jan", y: 400 },
        { x: "Feb", y: 234 },
        { x: "March", y: 342 },
        { x: "April", y: 350 },
        { x: "May", y: 420 },
        { x: "June", y: 390 },
        { x: "July", y: 420 },
        { x: "Aug", y: 400 },
        { x: "Sept", y: 160 },
        { x: "Oct", y: 180 },
        { x: "Nov", y: 350 },
        { x: "Dec", y: 270 },
      ],
    },
    {
      name: "Found Items",
      color: "#88BDF1",
      data: [
        { x: "Jan", y: 343 },
        { x: "Feb", y: 321 },
        { x: "March", y: 234 },
        { x: "April", y: 213 },
        { x: "May", y: 342 },
        { x: "June", y: 125 },
        { x: "July", y: 156 },
        { x: "Aug", y: 430 },
        { x: "Sept", y: 230 },
        { x: "Oct", y: 230 },
        { x: "Nov", y: 120 },
        { x: "Dec", y: 324 },
      ],
    },
  ];

  return (
    <div className="body">
      <Chart options={options} series={series} type="bar" height={'100%'} />
    </div>
  );
}

export default ClaimedLostFoundChart;
