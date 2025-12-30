import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';

interface CandleData {
  x: string | number;
  y: [number, number, number, number]; // [open, high, low, close]
}

interface ApexCandleChartProps {
  data: CandleData[];
  symbol: string;
  height?: number;
  theme?: 'light' | 'dark';
}

export const ApexCandleChart: React.FC<ApexCandleChartProps> = ({
  data,
  symbol,
  height = 400,
  theme = 'light'
}) => {
  const series = useMemo(() => {
    return [{
      data: data.map(d => ({
        x: d.x,
        y: d.y
      }))
    }];
  }, [data]);

  const options = {
    chart: {
      type: 'candlestick' as const,
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
      text: `${symbol} - Candlestick Chart`,
      style: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: theme === 'dark' ? '#f3f4f6' : '#111827'
      }
    },
    xaxis: {
      type: 'datetime' as const,
      labels: {
        style: {
          colors: theme === 'dark' ? '#9ca3af' : '#6b7280'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: theme === 'dark' ? '#9ca3af' : '#6b7280'
        }
      }
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#10b981',
          downward: '#ef4444'
        }
      }
    },
    grid: {
      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
    },
    tooltip: {
      theme: theme,
      x: {
        format: 'dd MMM yyyy HH:mm'
      }
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
          No chart data available
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-lg p-4 ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    }`}>
      <Chart
        options={options}
        series={series}
        type="candlestick"
        height={height}
      />
    </div>
  );
};

export default ApexCandleChart;
