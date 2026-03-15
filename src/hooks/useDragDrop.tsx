import { useCallback, useState, type DragEvent } from 'react';

export type DragItemType = 'project' | 'agent' | 'skill' | 'employee';

interface DragPayload {
  type: DragItemType;
  data: Record<string, unknown>;
}

const DRAG_MIME = 'application/x-planner-drag';

export function useDraggable(type: DragItemType, data: Record<string, unknown>) {
  const onDragStart = useCallback((e: DragEvent) => {
    const payload: DragPayload = { type, data };
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copy';
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  }, [type, data]);

  const onDragEnd = useCallback((e: DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
  }, []);

  return {
    draggable: true,
    onDragStart,
    onDragEnd,
  };
}

export function useDropZone(
  acceptTypes: DragItemType[],
  onDrop: (type: DragItemType, data: Record<string, unknown>) => void
) {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes(DRAG_MIME)) {
      e.dataTransfer.dropEffect = 'copy';
      setIsOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    try {
      const raw = e.dataTransfer.getData(DRAG_MIME);
      if (!raw) return;
      const payload: DragPayload = JSON.parse(raw);
      if (acceptTypes.includes(payload.type)) {
        onDrop(payload.type, payload.data);
      }
    } catch {
      // ignore invalid drag data
    }
  }, [acceptTypes, onDrop]);

  return {
    isOver,
    dropZoneProps: {
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}
