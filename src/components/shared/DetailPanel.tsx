import { X, GripHorizontal } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';

interface DetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function DetailPanel({ isOpen, onClose, title, subtitle, children }: DetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 480, h: 520 });
  const [centered, setCentered] = useState(false);
  const dragging = useRef(false);
  const resizing = useRef<string | false>(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });
  const sizeStart = useRef({ w: 480, h: 520 });

  // Center on open
  useEffect(() => {
    if (isOpen) {
      const w = 480;
      const h = 520;
      const x = Math.round((window.innerWidth - w) / 2);
      const y = Math.round((window.innerHeight - h) / 2);
      setSize({ w, h });
      setPos({ x: Math.max(20, x), y: Math.max(20, y) });
      setCentered(true);
    } else {
      setCentered(false);
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Drag handler
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...pos };

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 200, posStart.current.x + (ev.clientX - dragStart.current.x))),
        y: Math.max(0, Math.min(window.innerHeight - 60, posStart.current.y + (ev.clientY - dragStart.current.y))),
      });
    };
    const onUp = () => {
      dragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [pos]);

  // Resize handler
  const handleResizeStart = useCallback((edge: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = edge;
    dragStart.current = { x: e.clientX, y: e.clientY };
    sizeStart.current = { ...size };
    posStart.current = { ...pos };

    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const dx = ev.clientX - dragStart.current.x;
      const dy = ev.clientY - dragStart.current.y;
      const edge = resizing.current;

      let newW = sizeStart.current.w;
      let newH = sizeStart.current.h;
      let newX = posStart.current.x;
      let newY = posStart.current.y;

      if (edge.includes('e')) newW = Math.max(320, Math.min(900, sizeStart.current.w + dx));
      if (edge.includes('w')) {
        newW = Math.max(320, Math.min(900, sizeStart.current.w - dx));
        newX = posStart.current.x + (sizeStart.current.w - newW);
      }
      if (edge.includes('s')) newH = Math.max(250, Math.min(800, sizeStart.current.h + dy));
      if (edge.includes('n')) {
        newH = Math.max(250, Math.min(800, sizeStart.current.h - dy));
        newY = posStart.current.y + (sizeStart.current.h - newH);
      }

      setSize({ w: newW, h: newH });
      setPos({ x: newX, y: newY });
    };
    const onUp = () => {
      resizing.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [size, pos]);

  if (!isOpen) return null;

  return (
    <>
    {/* Click-outside backdrop */}
    <div className="fixed inset-0 z-40" onClick={onClose} />
    <div
      ref={panelRef}
      onClick={(e) => e.stopPropagation()}
      className={`fixed z-50 flex flex-col
        bg-bg-surface border border-border rounded-2xl
        shadow-[0_8px_40px_rgba(0,0,0,0.12)]
        transition-opacity duration-200
        ${centered ? 'opacity-100' : 'opacity-0'}`}
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
      }}
    >
      {/* Resize handles */}
      <div onMouseDown={handleResizeStart('e')} className="absolute top-2 right-0 bottom-2 w-1.5 cursor-ew-resize hover:bg-accent/20 rounded-full transition-colors" />
      <div onMouseDown={handleResizeStart('w')} className="absolute top-2 left-0 bottom-2 w-1.5 cursor-ew-resize hover:bg-accent/20 rounded-full transition-colors" />
      <div onMouseDown={handleResizeStart('s')} className="absolute bottom-0 left-2 right-2 h-1.5 cursor-ns-resize hover:bg-accent/20 rounded-full transition-colors" />
      <div onMouseDown={handleResizeStart('se')} className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize" />
      <div onMouseDown={handleResizeStart('sw')} className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize" />

      {/* Draggable Header */}
      <div
        onMouseDown={handleDragStart}
        className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-border cursor-grab active:cursor-grabbing select-none rounded-t-2xl"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <GripHorizontal size={14} className="text-text-muted shrink-0" />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text-primary truncate">{title}</h2>
            {subtitle && <p className="text-[11px] text-text-muted font-mono truncate">{subtitle}</p>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-bg-surface-hover text-text-muted hover:text-text-primary transition-colors shrink-0 ml-2"
        >
          <X size={14} />
        </button>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {children}
      </div>
    </div>
    </>
  );
}
