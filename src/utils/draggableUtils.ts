export function getControlPosition(e: MouseEvent) {
  return offsetXYFromParentOf(e);
}

function offsetXYFromParentOf(e: MouseEvent) {
  const offsetParent = (e.target as HTMLElement).offsetParent || document.body;
  const offsetParentRect = offsetParent === document.body ? { left: 0, top: 0 } : offsetParent.getBoundingClientRect();
  const x = e.clientX + offsetParent.scrollLeft - offsetParentRect.left;
  const y = e.clientY + offsetParent.scrollTop - offsetParentRect.top;
  return { x, y };
}

export function getNewPosition(e: MouseEvent, transformScale: number = 1) {
  let { left: pLeft, top: pTop } = (e.target as HTMLElement).offsetParent!.getBoundingClientRect();
  let { left: cLeft, top: cTop } = (e.target as HTMLElement).getBoundingClientRect();
  cLeft = cLeft / transformScale;
  pLeft = pLeft / transformScale;
  cTop = cTop / transformScale;
  pTop = pTop / transformScale;
  return { left: cLeft - pLeft, top: cTop - pTop };
}

export function createMoveData(lastX: number, lastY: number, x: number, y: number) {
  const isStart = !isNum(lastX);
  if (isStart) {
    return {
      deltaX: 0,
      deltaY: 0,
      lastX: x,
      lastY: y,
    };
  } else {
    return {
      deltaX: x - lastX,
      deltaY: y - lastY,
      lastX,
      lastY,
    };
  }
}

export function isNum(num: number) {
  return typeof num === 'number' && !isNaN(num);
}
