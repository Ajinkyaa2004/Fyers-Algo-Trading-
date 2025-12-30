import React from 'react';
import Chart from 'react-apexcharts';

interface ApexBarChartProps {
  data: {
    name: string;
    data: number[];
  }[];
  xAxisLabels?: string[];
  title?: string;
  yAxisTitle?: string;
  height?: number;
  theme?: 'light' | 'dark';
  horizontal?: boolean;
}

export const ApexBarChart: React.FC<ApexBarChartProps> = ({
  data,
  xAxisLabels = [],
  title = 'Volume Analysis',
  yAxisTitle = 'Volume',
  height = 350,
  theme = 'light',
  horizontal = false
}) => {
  const options = {
    chart: {
      type: horizontal ? 'barh' : 'bar',
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
    colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
    xaxis: {
      categories: xAxisLabels,
      labels: {
        style: {
          colors: theme === 'dark' ? '#9ca3af' : '#6b7280',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      title: {
        text: yAxisTitle,
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
    grid: {
      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
    },
    tooltip: {
      theme: theme
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
        series={data}
        type={horizontal ? 'barh' : 'bar'}
        height={height}
      />
    </div>
  );
};

export default ApexBarChart;
