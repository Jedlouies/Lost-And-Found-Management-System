import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import './styles/WeeklyUsersCard.css'

const WeeklyUsersCard = () => {
  const [state, setState] = useState({
    series: [
      {
        name: 'Active Users',
        data: [10, 41, 35, 51, 49, 62, 69],
      },
    ],
    options: {
      chart: {
        height: 200,
        type: 'line',
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
      show: true,
      position: "top",
      
      borderRadius: "80px",
      labels: {
        colors: ["#6B7280"],
        useSeriesColors: false,
      }
      },
      stroke: {
        curve: 'straight',
        colors: '#475C6F',
      },
      grid: {
        row: {
          colors: ['#f3f3f3', 'transparent'], 
          opacity: 0.5,
        },
      },
      xaxis: {
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
    },
  });

  return (
    <div id="chart" className='chart'>
      <ReactApexChart options={state.options} series={state.series} type="line" height={'300'} />
    </div>
  );
};

export default WeeklyUsersCard;
