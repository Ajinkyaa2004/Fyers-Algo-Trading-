import React from 'react';
import Chart from 'react-apexcharts';

interface ApexPieChartProps {
  series: number[];
  labels: string[];
  title?: string;
  height?: number;
  theme?: 'light' | 'dark';
  type?: 'pie' | 'donut';
}

export const ApexPieChart: React.FC<ApexPieChartProps> = ({
  series,
  labels,
  title = 'Portfolio Allocation',
  height = 350,
  theme = 'light',
  type = 'donut'
}) => {
  const options = {
    chart: {
      type: type as const,
      toolbar: {
        show: true,
        tools: {
          download: true
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
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'],
    labels: labels,
    legend: {
      position: 'bottom' as const,
      labels: {
        colors: theme === 'dark' ? '#9ca3af' : '#6b7280'
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              color: theme === 'dark' ? '#9ca3af' : '#6b7280'
            },
            value: {
              color: theme === 'dark' ? '#f3f4f6' : '#111827'
            },
            total: {
              show: true,
              label: 'Total Holdings',
              color: theme === 'dark' ? '#9ca3af' : '#6b7280'
            }
          }
        }
      }
    },
    tooltip: {
      theme: theme,
      y: {
        formatter: (val: number) => `${val.toFixed(2)}%`
      }
    }
  };

  return (
    <div className={`w-full rounded-lg p-4 ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    }`}>
      <Chart
        options={options}
        series={series}
        type={type}
        height={height}
      />
    </div>
  );
};

export default ApexPieChart;
