import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, AreaSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import type { TimeSeriesPoint } from '../../types';

interface InteractiveChartProps {
  data: TimeSeriesPoint[];
  symbol: string;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({ data }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawings, setDrawings] = useState<{ p1: { x: number; y: number }; p2: { x: number; y: number } }[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<{ p1: { x: number; y: number }; p2: { x: number; y: number } | null } | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'white' },
        textColor: 'black',
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: '#e1e1e1' },
        horzLines: { color: '#e1e1e1' },
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#2962FF',
      topColor: '#2962FF',
      bottomColor: 'rgba(41, 98, 255, 0.28)',
    });

    const chartData = data.map((d) => ({
      time: (new Date(d.timestamp).getTime() / 1000) as Time,
      value: d.value,
    }));

    areaSeries.setData(chartData);

    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = areaSeries;

    const handleResize = () => {
      if (chartContainerRef.current)
      {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  // Simple overlay for drawing
  // Note: Real integration with lightweight-charts coordinates requires coordinate conversion.
  // For this MVP, we'll just do a simple canvas overlay on top of the container.

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !chartContainerRef.current) return;

    canvas.width = chartContainerRef.current.clientWidth;
    canvas.height = 400;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;

      // Draw saved drawings
      drawings.forEach(d => {
        ctx.beginPath();
        ctx.moveTo(d.p1.x, d.p1.y);
        ctx.lineTo(d.p2.x, d.p2.y);
        ctx.stroke();
      });

      // Draw current drawing
      if (currentDrawing && currentDrawing.p2)
      {
        ctx.beginPath();
        ctx.moveTo(currentDrawing.p1.x, currentDrawing.p1.y);
        ctx.lineTo(currentDrawing.p2.x, currentDrawing.p2.y);
        ctx.stroke();
      }
    };

    render();
  }, [drawings, currentDrawing, data]); // Re-render when drawings change

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!currentDrawing)
    {
      setCurrentDrawing({ p1: { x, y }, p2: null });
    } else
    {
      setDrawings([...drawings, { p1: currentDrawing.p1, p2: { x, y } }]);
      setCurrentDrawing(null);
      // setIsDrawing(false); // Keep drawing mode on?
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentDrawing) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentDrawing({ ...currentDrawing, p2: { x, y } });
  };

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10 bg-white p-2 rounded shadow flex gap-2">
        <button
          onClick={() => setIsDrawing(!isDrawing)}
          className={`px-3 py-1 rounded text-sm font-bold ${isDrawing ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}
        >
          {isDrawing ? 'Drawing Mode (Click start & end)' : 'Enable Drawing'}
        </button>
        {drawings.length > 0 && (
          <button
            onClick={() => setDrawings([])}
            className="px-3 py-1 rounded text-sm bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            Clear
          </button>
        )}
      </div>
      <div ref={chartContainerRef} className="w-full h-[400px]" />
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-[400px] ${isDrawing ? 'cursor-crosshair' : 'pointer-events-none'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      />
    </div>
  );
};
