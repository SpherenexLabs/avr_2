

import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import './App.css';

// Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyB9ererNsNonAzH0zQo_GS79XPOyCoMxr4",
  authDomain: "waterdtection.firebaseapp.com",
  databaseURL: "https://waterdtection-default-rtdb.firebaseio.com",
  projectId: "waterdtection",
  storageBucket: "waterdtection.firebasestorage.app",
  messagingSenderId: "690886375729",
  appId: "1:690886375729:web:172c3a47dda6585e4e1810",
  measurementId: "G-TXF33Y6XY0"
};

// Initialize Firebase app and database
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export default function App() {
  // Holds the latest values from the database
  const [data, setData] = useState({});
  // Holds historical data for each key to feed into charts
  const [history, setHistory] = useState({});
  // Loading state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reference to the AVR node in your database
    const avrRef = ref(database, 'AVR2');
    
    // Listen for realtime updates
    const unsubscribe = onValue(avrRef, (snapshot) => {
      const val = snapshot.val() || {};
      
      // Save the latest values
      setData(val);
      setLoading(false);
      
      // Update chart history for each key except 'Any'
      setHistory((prevHistory) => {
        const updatedHistory = { ...prevHistory };
        Object.entries(val).forEach(([key, value]) => {
          if (key.toLowerCase() === 'any') return;
          if (!updatedHistory[key]) {
            updatedHistory[key] = [];
          }
          // Append new data point with a timestamp
          updatedHistory[key] = [
            ...updatedHistory[key],
            { time: Date.now(), value: value }
          ].slice(-20); // keep only the last 20 points
        });
        return updatedHistory;
      });
    });
    
    // Cleanup listener when component unmounts
    return () => unsubscribe();
  }, []);

  // Card styles based on metric types
  const getCardStyle = (key) => {
    const keyLower = key.toLowerCase();
    
    const styles = {
      line: {
        icon: '⚡',
        bgGradient: 'var(--gradient-blue)'
      },
      system: {
        icon: '🔄',
        bgGradient: 'var(--gradient-green)'
      },
      vin: {
        icon: '🔌',
        bgGradient: 'var(--gradient-orange)'
      },
      vout: {
        icon: '⚙️',
        bgGradient: 'var(--gradient-purple)'
      },
      current: {
        icon: '🔋',
        bgGradient: 'var(--gradient-teal)'
      },
      power: {
        icon: '⚡',
        bgGradient: 'var(--gradient-red)'
      }
    };
    
    // Return specific style or default
    return styles[keyLower] || {
      icon: '📊',
      bgGradient: 'var(--gradient-purple)'
    };
  };

  // Generate cards for each metric except 'Any'
  const metricCards = Object.entries(data)
    .filter(([key]) => key.toLowerCase() !== 'any')
    .map(([key, value]) => {
      const { icon, bgGradient } = getCardStyle(key);
      
      return (
        <div 
          className="card"
          key={key} 
          style={{ background: bgGradient }}
        >
          <div className="card-content">
            <span className="card-icon">{icon}</span>
            <h2 className="card-title">{key}</h2>
            <div className="card-value-container">
              <p className="card-value">{value}</p>
            </div>
          </div>
          <div className="card-glow"></div>
        </div>
      );
    });

  // Generate charts for each metric using its history
  const chartCards = Object.entries(history)
    .filter(([key]) => key.toLowerCase() !== 'system')
    .map(([key, values]) => {
      // Skip empty history arrays
      if (!values || values.length === 0) return null;
      
      // Use actual timestamps for labels
      const labels = values.map((d) => new Date(d.time).toLocaleTimeString());
      const dataSet = values.map((d) => {
        const num = parseFloat(d.value);
        return isNaN(num) ? d.value : num;
      });
      
      const { bgGradient } = getCardStyle(key);
      // Extract color from gradient for chart
      const chartColor = bgGradient.includes('blue') ? '#42a5f5' : 
                         bgGradient.includes('green') ? '#66bb6a' : 
                         bgGradient.includes('orange') ? '#ffa726' : 
                         bgGradient.includes('purple') ? '#ab47bc' :
                         bgGradient.includes('teal') ? '#26a69a' : '#f44336';
      
      const chartData = {
        labels,
        datasets: [
          {
            label: key,
            data: dataSet,
            fill: true,
            borderColor: chartColor,
            backgroundColor: `${chartColor}20`, // 20 = 12.5% opacity
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: chartColor,
            tension: 0.4,
          },
        ],
      };
      
      return (
        <div className="chart-card" key={`chart-${key}`}>
          <h3 className="chart-title">
            <span className="chart-icon" style={{ background: bgGradient }}>
              {getCardStyle(key).icon}
            </span>
            {key} History
          </h3>
          <div className="chart-container">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                  padding: { bottom: 20 },
                },
                scales: {
                  x: {
                    ticks: {
                      maxTicksLimit: 4,
                      color: '#666',
                      font: {
                        size: 10
                      }
                    },
                    grid: {
                      display: false,
                    },
                  },
                  y: {
                    ticks: {
                      color: '#666',
                      font: {
                        size: 10
                      }
                    },
                    grid: {
                      color: 'rgba(0,0,0,0.05)',
                    },
                  },
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    titleColor: '#333',
                    bodyColor: '#333',
                    borderColor: 'rgba(0,0,0,0.1)',
                    borderWidth: 1,
                    padding: 10,
                    boxWidth: 10,
                    usePointStyle: true,
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: ${context.parsed.y}`;
                      }
                    }
                  }
                },
                interaction: {
                  intersect: false,
                  mode: 'nearest'
                },
                animation: {
                  duration: 1000
                }
              }}
            />
          </div>
        </div>
      );
    });

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          Advanced Voltage Regulatory System
          <span className="dashboard-subtitle">Real-time Monitoring</span>
        </h1>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Connecting to system...</p>
        </div>
      ) : (
        <>
          <div className="cards-container">
            {metricCards.length > 0 ? metricCards : (
              <div className="empty-state">
                <p>No metrics available. Waiting for data...</p>
              </div>
            )}
          </div>
          
          <div className="charts-container">
            {chartCards.length > 0 ? chartCards : (
              <div className="empty-state">
                <p>No historical data available yet</p>
              </div>
            )}
          </div>
        </>
      )}
      
      <div className="dashboard-footer">
        <p>Last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}