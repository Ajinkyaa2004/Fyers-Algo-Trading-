import React from 'react';
import Chart from 'react-apexcharts';

interface AreaChartData {
  name: string;
  data: (number | null)[];
}

interface ApexAreaChartProps {
  data: AreaChartData[];
  xAxisLabels?: string[];
  title?: string;
  yAxisTitle?: string;
  height?: number;
  theme?: 'light' | 'dark';
}

export const ApexAreaChart: React.FC<ApexAreaChartProps> = ({
  data,
  xAxisLabels = [],
  title = 'Portfolio Value',
  yAxisTitle = 'Value (₹)',
  height = 350,
  theme = 'light'
}) => {
  const options = {
    chart: {
      type: 'area' as const,
      stacked: false,
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
    colors: ['#3b82f6', '#10b981', '#f59e0b'],
    stroke: {
      curve: 'smooth' as const,
      width: 2
    },
    fill: {
      type: 'gradient' as const,
      gradient: {
        opacityFrom: 0.45,
        opacityTo: 0.05
      }
    },
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
      },
      y: {
        formatter: (val: number) => `₹${val.toFixed(2)}`
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
        series={data}
        type="area"
        height={height}
      />
    </div>
  );
};

export default ApexAreaChart;
