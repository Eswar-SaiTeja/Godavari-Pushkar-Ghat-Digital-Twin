import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Minus, 
  Square, 
  RotateCcw, 
  GripHorizontal 
} from 'lucide-react';

export interface FloatingPanelProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height?: number | 'auto' };
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  isOpen: boolean;
  onClose: () => void;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  resizable?: boolean;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  title,
  subtitle,
  icon,
  defaultPosition = { x: 300, y: 76 },
  defaultSize = { width: 340, height: 'auto' },
  minWidth = 280,
  maxWidth = 640,
  minHeight = 180,
  maxHeight = 720,
  isOpen,
  onClose,
  headerExtra,
  children,
  className = '',
  resizable = true,
}) => {
  // Position state (clamped to viewport)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    // Initial responsive positioning fallback
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      return isMobile 
        ? { x: 12, y: 72 } 
        : { x: Math.min(defaultPosition.x, window.innerWidth - 360), y: defaultPosition.y };
    }
    return defaultPosition;
  });

  // Size state
  const [size, setSize] = useState<{ width: number; height: number | 'auto' }>({
    width: typeof window !== 'undefined' && window.innerWidth < 400 ? window.innerWidth - 24 : defaultSize.width,
    height: defaultSize.height ?? 'auto',
  });

  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });
  const resizeStartRef = useRef<{ startX: number; startY: number; initialWidth: number; initialHeight: number }>({
    startX: 0,
    startY: 0,
    initialWidth: 0,
    initialHeight: 0,
  });

  // Keep inside viewport on window resize and dragging
  const clampPosition = useCallback((x: number, y: number, currentWidth: number) => {
    // Allow dragging freely while keeping header accessible
    const maxX = Math.max(0, window.innerWidth - Math.min(currentWidth, 80));
    // Allow panel to be moved down or up, but keep header visible between top toolbar (64px) and bottom
    const maxY = Math.max(64, window.innerHeight - 50);
    return {
      x: Math.max(0, Math.min(maxX, x)),
      y: Math.max(64, Math.min(maxY, y)),
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (!panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      setPosition(prev => clampPosition(prev.x, prev.y, rect.width));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition]);

  // Pointer drag handling on header
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Do NOT drag if clicking on buttons, inputs, toggles, or controls marked data-no-drag
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a, [data-no-drag="true"]')) {
      return;
    }

    e.preventDefault();
    setIsDragging(true);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - dragStartRef.current.startX;
      const deltaY = moveEvent.clientY - dragStartRef.current.startY;
      const rawX = dragStartRef.current.initialX + deltaX;
      const rawY = dragStartRef.current.initialY + deltaY;

      const panelRect = panelRef.current?.getBoundingClientRect();
      const currentWidth = panelRect?.width || size.width;

      const clamped = clampPosition(rawX, rawY, currentWidth);
      setPosition(clamped);
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Resize handler (bottom-right corner)
  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>, direction: 'se' | 'e' | 's') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const panelRect = panelRef.current?.getBoundingClientRect();
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: panelRect?.width || size.width,
      initialHeight: panelRect?.height || 350,
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - resizeStartRef.current.startX;
      const deltaY = moveEvent.clientY - resizeStartRef.current.startY;

      let newWidth = resizeStartRef.current.initialWidth;
      let newHeight: number | 'auto' = resizeStartRef.current.initialHeight;

      if (direction === 'se' || direction === 'e') {
        const availableMaxWidth = Math.min(maxWidth, window.innerWidth - position.x - 12);
        newWidth = Math.max(minWidth, Math.min(availableMaxWidth, resizeStartRef.current.initialWidth + deltaX));
      }

      if (direction === 'se' || direction === 's') {
        const availableMaxHeight = Math.min(maxHeight, window.innerHeight - position.y - 12);
        newHeight = Math.max(minHeight, Math.min(availableMaxHeight, resizeStartRef.current.initialHeight + deltaY));
      }

      setSize({ width: Math.round(newWidth), height: typeof newHeight === 'number' ? Math.round(newHeight) : newHeight });
    };

    const onPointerUp = () => {
      setIsResizing(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Reset to default location and size
  const handleReset = () => {
    const isMobile = window.innerWidth < 768;
    setPosition(isMobile ? { x: 12, y: 72 } : defaultPosition);
    setSize({
      width: isMobile ? window.innerWidth - 24 : defaultSize.width,
      height: defaultSize.height ?? 'auto',
    });
    setIsMinimized(false);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: isMinimized ? 'auto' : (typeof size.height === 'number' ? `${size.height}px` : 'auto'),
        maxHeight: isMinimized ? 'auto' : `min(${maxHeight}px, calc(100vh - ${Math.max(64, position.y)}px - 56px))`,
      }}
      className={`fixed z-30 flex flex-col glass-panel rounded-xl border border-cyan-500/30 shadow-panel select-none overflow-hidden transition-shadow ${
        isDragging ? 'shadow-glow-cyan cursor-grabbing opacity-95' : 'shadow-2xl'
      } ${className}`}
    >
      {/* Draggable Header Bar */}
      <div
        onPointerDown={handlePointerDown}
        className={`flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-cyan-500/20 select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab hover:bg-slate-800/80'
        }`}
        title="Click and drag to move panel"
      >
        {/* Title, Icon & Drag affordance */}
        <div className="flex items-center gap-2 min-w-0 mr-2 pointer-events-none">
          <GripHorizontal className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          {icon && <span className="text-cyan-400 flex-shrink-0">{icon}</span>}
          <div className="truncate">
            <h3 className="text-xs font-mono font-bold tracking-wider text-cyan-200 uppercase truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[9px] font-mono text-slate-400 truncate -mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1 flex-shrink-0" data-no-drag="true">
          {headerExtra}

          {/* Reset Position */}
          <button
            onClick={handleReset}
            className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
            title="Reset position and dimensions"
            aria-label="Reset position"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Minimize / Restore */}
          <button
            onClick={() => setIsMinimized(prev => !prev)}
            className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
            title={isMinimized ? 'Restore panel' : 'Minimize panel'}
            aria-label={isMinimized ? 'Restore panel' : 'Minimize panel'}
          >
            {isMinimized ? <Square className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors ml-0.5"
            title="Close panel"
            aria-label="Close panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Panel Body Content (hidden when minimized) */}
      {!isMinimized && (
        <div className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar flex flex-col overscroll-contain">
          {children}
        </div>
      )}

      {/* Resize Handle (Bottom-Right Corner) */}
      {!isMinimized && resizable && (
        <div
          onPointerDown={(e) => handleResizePointerDown(e, 'se')}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 text-slate-600 hover:text-cyan-400 group"
          title="Drag to resize panel"
        >
          <svg
            className={`w-2.5 h-2.5 transition-colors ${isResizing ? 'text-cyan-400' : 'text-slate-600 group-hover:text-cyan-400'}`}
            viewBox="0 0 6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <line x1="5" y1="1" x2="1" y2="5" />
            <line x1="5" y1="3" x2="3" y2="5" />
          </svg>
        </div>
      )}
    </div>
  );
};
