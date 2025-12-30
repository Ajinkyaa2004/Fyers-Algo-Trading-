import React from 'react';
import Chart from 'react-apexcharts';

interface IndicatorData {
  name: string;
  data: (number | null)[];
}

interface ApexIndicatorChartProps {
  priceData: {
    name: string;
    data: (number | null)[];
  }[];
  indicatorData: IndicatorData[];
  xAxisLabels?: string[];
  title?: string;
  height?: number;
  theme?: 'light' | 'dark';
}

export const ApexIndicatorChart: React.FC<ApexIndicatorChartProps> = ({
  priceData,
  indicatorData,
  xAxisLabels = [],
  title = 'Technical Indicators',
  height = 400,
  theme = 'light'
}) => {
  const allData = [...priceData, ...indicatorData];

  const options = {
    chart: {
      type: 'line' as const,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      },
      background: theme === 'dark' ? '#1f2937' : '#ffffff'
    },
    title: {
      text: title,
      style: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: theme === 'dark' ? '#f3f4f6' : '#111827'
      }
    },
    stroke: {
      curve: 'smooth' as const,
      width: [2, 1, 1, 1, 1]
    },
    colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
    xaxis: {
      categories: xAxisLabels,
      labels: {
        style: {
          colors: theme === 'dark' ? '#9ca3af' : '#6b7280',
          fontSize: '12px'
        }
      }
    },
    yaxis: [
      {
        title: {
          text: 'Price',
          style: {
            color: theme === 'dark' ? '#9ca3af' : '#6b7280'
          }
        },
        labels: {
          style: {
            colors: theme === 'dark' ? '#9ca3af' : '#6b7280'
          }
        }
      },
      {
        opposite: true,
        title: {
          text: 'Indicator Value',
          style: {
            color: theme === 'dark' ? '#9ca3af' : '#6b7280'
          }
        },
        labels: {
          style: {
            colors: theme === 'dark' ? '#9ca3af' : '#6b7280'
          }
        }
      }
    ],
    grid: {
      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
      show: true,
      xaxis: {
        lines: {
          show: false
        }
      }
    },
    tooltip: {
      theme: theme,
      x: {
        show: true
      }
    },
    legend: {
      position: 'top' as const,
      labels: {
        colors: theme === 'dark' ? '#9ca3af' : '#6b7280'
      }
    }
  };

  return (
    <div className={`w-full rounded-lg p-4 ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    }`}>
      <Chart
        options={options}
        series={allData}
        type="line"
        height={height}
      />
    </div>
  );
};

export default ApexIndicatorChart;
