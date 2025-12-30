import React, { useState, useRef } from 'react';
import {
  Crosshair,
  Pencil,
  Type,
  Circle,
  Square,
  Trash2,
  ZoomIn,
  Copy,
  Undo2,
  Eye,
  Download,
  Settings
} from 'lucide-react';

interface DrawingTool {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface ChartDrawingTools {
  onToolSelect: (tool: string) => void;
  onClear: () => void;
  currentTool: string;
}

export const ChartDrawingToolbar: React.FC<ChartDrawingTools> = ({
  onToolSelect,
  onClear,
  currentTool
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [lineColor, setLineColor] = useState('#3b82f6');
  const [lineWidth, setLineWidth] = useState(2);
  const [fillColor, setFillColor] = useState('#3b82f6');

  const drawingTools: DrawingTool[] = [
    { id: 'select', name: 'Selection', icon: <Crosshair size={18} /> },
    { id: 'line', name: 'Line', icon: <Pencil size={18} /> },
    { id: 'text', name: 'Text', icon: <Type size={18} /> },
    { id: 'circle', name: 'Circle', icon: <Circle size={18} /> },
    { id: 'rectangle', name: 'Rectangle', icon: <Square size={18} /> },
    { id: 'zoom', name: 'Zoom', icon: <ZoomIn size={18} /> },
  ];

  return (
    <div className="flex flex-col gap-2 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 w-16">
      {/* Drawing Tools */}
      <div className="space-y-1">
        {drawingTools.map(tool => (
          <button
            key={tool.id}
            onClick={() => onToolSelect(tool.id)}
            title={tool.name}
            className={`w-full p-2 rounded transition-colors ${
              currentTool === tool.id
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      <div className="h-px bg-zinc-700" />

      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="w-full p-2 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
        title="Settings"
      >
        <Settings size={18} />
      </button>

      {/* Clear Button */}
      <button
        onClick={onClear}
        className="w-full p-2 rounded bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-colors"
        title="Clear Drawing"
      >
        <Trash2 size={18} />
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute left-20 top-0 bg-zinc-900 border border-zinc-800 rounded-lg p-4 w-64 z-50 shadow-lg">
          <h3 className="text-white font-semibold mb-4">Drawing Settings</h3>

          {/* Line Color */}
          <div className="mb-4">
            <label className="text-xs text-zinc-400 mb-2 block">Line Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={lineColor}
                onChange={(e) => setLineColor(e.target.value)}
                className="w-12 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={lineColor}
                onChange={(e) => setLineColor(e.target.value)}
                className="flex-1 px-2 py-1 bg-zinc-800 text-white text-xs rounded"
              />
            </div>
          </div>

          {/* Fill Color */}
          <div className="mb-4">
            <label className="text-xs text-zinc-400 mb-2 block">Fill Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="w-12 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="flex-1 px-2 py-1 bg-zinc-800 text-white text-xs rounded"
              />
            </div>
          </div>

          {/* Line Width */}
          <div>
            <label className="text-xs text-zinc-400 mb-2 block">
              Line Width: {lineWidth}px
            </label>
            <input
              type="range"
              min="1"
              max="8"
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-700 flex gap-2">
            <button
              onClick={() => setShowSettings(false)}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdvancedChartTools: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState('select');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);

  const handleToolSelect = (tool: string) => {
    setSelectedTool(tool);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setStartX(e.clientX - rect.left);
    setStartY(e.clientY - rect.top);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Redraw based on tool
    if (selectedTool === 'line') {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
    } else if (selectedTool === 'rectangle') {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      const width = currentX - startX;
      const height = currentY - startY;
      ctx.strokeRect(startX, startY, width, height);
    } else if (selectedTool === 'circle') {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
      ctx.beginPath();
      ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  return (
    <div className="flex gap-4">
      <ChartDrawingToolbar
        onToolSelect={handleToolSelect}
        onClear={handleClear}
        currentTool={selectedTool}
      />

      <div className="flex-1">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`w-full bg-gradient-to-b from-zinc-950 to-black cursor-${
              selectedTool === 'select' ? 'default' : selectedTool === 'line' ? 'crosshair' : 'pointer'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
