import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  GripHorizontal, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { hudPositionManager, HUDPanelState } from '../../services/hudPositionManager';

export interface DraggableHUDWrapperProps {
  panelId: string;
  defaultPosition: { x: number; y: number };
  title?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  minimizedContent?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  resizable?: boolean;
  minWidth?: number;
  maxWidth?: number;
  isInitialMinimized?: boolean;
  onPositionChange?: (pos: { x: number; y: number }) => void;
}

export const DraggableHUDWrapper: React.FC<DraggableHUDWrapperProps> = ({
  panelId,
  defaultPosition,
  title,
  icon,
  badge,
  headerExtra,
  children,
  minimizedContent,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  resizable = false,
  minWidth = 180,
  maxWidth = 1200,
  isInitialMinimized = false,
  onPositionChange,
}) => {
  // Read persisted position or fallback to default
  const [panelState, setPanelState] = useState<HUDPanelState>(() => {
    const initial = hudPositionManager.getPosition(panelId, defaultPosition);
    if (isInitialMinimized) {
      initial.isMinimized = true;
    }
    return initial;
  });

  const [zIndex, setZIndex] = useState<number>(20);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [customWidth, setCustomWidth] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  const resizeStartRef = useRef<{
    startX: number;
    initialWidth: number;
  }>({
    startX: 0,
    initialWidth: 0,
  });

  // Clamp position to visible viewport
  const clampPosition = useCallback((x: number, y: number, currentWidth: number) => {
    if (typeof window === 'undefined') return { x, y };

    const minX = 0;
    const maxX = Math.max(0, window.innerWidth - Math.min(currentWidth, 80));
    const minY = 64; // Below 64px top navigation bar
    const maxY = Math.max(minY, window.innerHeight - 44);

    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  }, []);

  // Bring panel to front on click or drag
  const bringToFront = useCallback(() => {
    const newZ = hudPositionManager.bringToFront();
    setZIndex(newZ);
  }, []);

  // Subscribe to global layout reset
  useEffect(() => {
    const unsubscribe = hudPositionManager.subscribeToGlobalReset(() => {
      const clamped = clampPosition(defaultPosition.x, defaultPosition.y, 300);
      const newState: HUDPanelState = {
        x: clamped.x,
        y: clamped.y,
        isMinimized: false,
      };
      setPanelState(newState);
      setCustomWidth(null);
    });

    return () => unsubscribe();
  }, [defaultPosition, clampPosition]);

  // Window resize handler: ensure panel stays visible inside viewport
  useEffect(() => {
    const handleWindowResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setPanelState(prev => {
        const clamped = clampPosition(prev.x, prev.y, rect.width);
        if (clamped.x !== prev.x || clamped.y !== prev.y) {
          hudPositionManager.savePosition(panelId, { ...prev, x: clamped.x, y: clamped.y });
          return { ...prev, x: clamped.x, y: clamped.y };
        }
        return prev;
      });
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [panelId, clampPosition]);

  // Pointer Down on Drag Header
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Do NOT drag if clicking on buttons, inputs, links, sliders, or no-drag elements
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a, [data-no-drag="true"]')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    bringToFront();
    setIsDragging(true);

    const pointerId = e.pointerId;
    const targetEl = e.currentTarget;
    try {
      targetEl.setPointerCapture(pointerId);
    } catch (_) {}

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: panelState.x,
      initialY: panelState.y,
    };

    let latestX = panelState.x;
    let latestY = panelState.y;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;

      const deltaX = moveEvent.clientX - dragStartRef.current.startX;
      const deltaY = moveEvent.clientY - dragStartRef.current.startY;
      const rawX = dragStartRef.current.initialX + deltaX;
      const rawY = dragStartRef.current.initialY + deltaY;

      const panelRect = containerRef.current?.getBoundingClientRect();
      const currentWidth = panelRect?.width || 300;

      const clamped = clampPosition(rawX, rawY, currentWidth);
      latestX = clamped.x;
      latestY = clamped.y;

      setPanelState(prev => ({ ...prev, x: clamped.x, y: clamped.y }));
      if (onPositionChange) onPositionChange(clamped);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      setIsDragging(false);

      try {
        targetEl.releasePointerCapture(pointerId);
      } catch (_) {}

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      // Persist final position in localStorage
      hudPositionManager.savePosition(panelId, {
        x: latestX,
        y: latestY,
        isMinimized: panelState.isMinimized,
      });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Double Click on Header restores default position
  const handleHeaderDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only double click if not on interactive child
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a, [data-no-drag="true"]')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    handleResetPosition();
  };

  // Reset to default position
  const handleResetPosition = () => {
    const clamped = clampPosition(defaultPosition.x, defaultPosition.y, 300);
    const newState: HUDPanelState = {
      x: clamped.x,
      y: clamped.y,
      isMinimized: false,
    };
    setPanelState(newState);
    setCustomWidth(null);
    hudPositionManager.resetPosition(panelId);
    if (onPositionChange) onPositionChange(clamped);
  };

  // Toggle Minimized state
  const handleToggleMinimize = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setPanelState(prev => {
      const nextMin = !prev.isMinimized;
      const updated = { ...prev, isMinimized: nextMin };
      hudPositionManager.savePosition(panelId, updated);
      return updated;
    });
  };

  // Resize handler (right edge)
  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    bringToFront();
    setIsResizing(true);

    const currentWidth = containerRef.current?.getBoundingClientRect().width || 300;
    resizeStartRef.current = {
      startX: e.clientX,
      initialWidth: currentWidth,
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - resizeStartRef.current.startX;
      const availableMaxWidth = Math.min(maxWidth, window.innerWidth - panelState.x - 12);
      const newWidth = Math.max(minWidth, Math.min(availableMaxWidth, resizeStartRef.current.initialWidth + deltaX));
      setCustomWidth(Math.round(newWidth));
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

  return (
    <div
      ref={containerRef}
      onMouseDown={bringToFront}
      onTouchStart={bringToFront}
      onWheel={(e) => e.stopPropagation()}
      onWheelCapture={(e) => e.stopPropagation()}
      style={{
        left: `${panelState.x}px`,
        top: `${panelState.y}px`,
        zIndex,
        width: customWidth ? `${customWidth}px` : undefined,
      }}
      className={`fixed select-none flex flex-col pointer-events-auto transition-shadow duration-200 ${
        isDragging ? 'cursor-grabbing opacity-95 shadow-[0_0_25px_rgba(0,240,255,0.4)]' : ''
      } ${className}`}
    >
      {/* DRAGGABLE HEADER BAR */}
      <div
        onPointerDown={handlePointerDown}
        onDoubleClick={handleHeaderDoubleClick}
        className={`flex items-center justify-between px-3 py-1.5 select-none transition-colors ${
          isDragging 
            ? 'cursor-grabbing bg-slate-900/95 border-cyan-400' 
            : 'cursor-grab hover:bg-slate-850/90'
        } ${headerClassName}`}
        title="Click and drag to move panel • Double-click to reset position"
      >
        {/* Title, Icon & Drag Handle */}
        <div className="flex items-center gap-2 min-w-0 pointer-events-none">
          <div className="flex items-center text-slate-500 hover:text-cyan-400 transition-colors">
            <GripHorizontal className="w-3.5 h-3.5" />
          </div>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {title && (
            <div className="text-xs font-mono font-bold tracking-wider uppercase truncate">
              {title}
            </div>
          )}
          {badge && <div className="flex-shrink-0">{badge}</div>}
        </div>

        {/* Action Controls (Reset, Minimize/Restore, Extra) */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-2" data-no-drag="true">
          {headerExtra}

          {/* Reset Single Panel Position */}
          <button
            onClick={handleResetPosition}
            className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
            title="Reset position to default (or double-click header)"
            aria-label="Reset position"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Minimize / Restore Toggle */}
          <button
            onClick={handleToggleMinimize}
            className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
            title={panelState.isMinimized ? 'Restore panel' : 'Minimize panel'}
            aria-label={panelState.isMinimized ? 'Restore panel' : 'Minimize panel'}
          >
            {panelState.isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* PANEL BODY (Hidden or Custom when minimized) */}
      {!panelState.isMinimized ? (
        <div 
          onWheel={(e) => e.stopPropagation()}
          className={`flex-1 min-h-0 select-text ${bodyClassName}`}
        >
          {children}
        </div>
      ) : (
        minimizedContent && (
          <div 
            onClick={handleToggleMinimize}
            className="px-3 py-1 bg-slate-900/90 border border-t-0 border-cyan-500/20 rounded-b-xl text-[10px] font-mono text-slate-400 hover:text-cyan-300 cursor-pointer transition-colors"
          >
            {minimizedContent}
          </div>
        )
      )}

      {/* OPTIONAL RESIZE HANDLE */}
      {resizable && !panelState.isMinimized && (
        <div
          onPointerDown={handleResizePointerDown}
          className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-se-resize flex items-end justify-end p-0.5 text-slate-500 hover:text-cyan-400"
          title="Drag to resize width"
        >
          <svg className={`w-2 h-2 ${isResizing ? 'text-cyan-400' : ''}`} viewBox="0 0 6 6" fill="none" stroke="currentColor">
            <line x1="5" y1="1" x2="1" y2="5" />
            <line x1="5" y1="3" x2="3" y2="5" />
          </svg>
        </div>
      )}
    </div>
  );
};
