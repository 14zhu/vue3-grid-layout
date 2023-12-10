import { GridItem } from '../types';

export function collides(a: GridItem, b: GridItem) {
  if (a === b) return false;
  if (a.x + a.w <= b.x) return false;
  if (a.x >= b.x + b.w) return false;
  if (a.y + a.h <= b.y) return false;
  if (a.y >= b.y + b.h) return false;
  return true;
}

export function getStatics(layout: GridItem[]) {
  return layout.filter((item) => item.static);
}

export function getAllCollisions(layout: GridItem[], layoutItem: GridItem) {
  return layout.filter((item) => collides(item, layoutItem));
}

export function getFirstCollision(layout: GridItem[], layoutItem: GridItem) {
  for (let i = 0, len = layout.length; i < len; i++) {
    if (collides(layout[i], layoutItem)) return layout[i];
  }
}

export function sortLayoutItemsByRowCol(layout: GridItem[]) {
  return [...layout].sort((a, b) => {
    const { x: x1, y: y1 } = a;
    const { x: x2, y: y2 } = b;
    if (x1 == x2 && y1 == y2) return 0;
    if (y1 > y2 || (y1 == y2 && x1 > x2)) return 1;
    return -1;
  });
}

export function moveElementAwayFromCollision(layout: GridItem[], collision: GridItem, itemToMove: GridItem, isUserAction: boolean) {
  if (isUserAction) {
    const fakeItem = {
      x: itemToMove.x,
      y: itemToMove.y,
      w: itemToMove.w,
      h: itemToMove.h,
      i: '-1',
    };
    fakeItem.y = Math.max(collision.y - itemToMove.h, 0);
    if (!getFirstCollision(layout, fakeItem)) {
      return moveElement(layout, itemToMove, undefined, fakeItem.y, false);
    }
  }
  return moveElement(layout, itemToMove, undefined, itemToMove.y + 1, false);
}

export function moveElement(layout: GridItem[], movingItem: GridItem, x: number | undefined, y: number, isUserAction: boolean, preventCollision?: boolean) {
  if (movingItem.static) return layout;
  let movedLayout = layout;
  const { x: oldX, y: oldY } = movingItem;
  const movingUp = y && oldY > y;

  if (typeof x === 'number') movingItem.x = x;
  if (typeof y === 'number') movingItem.y = y;
  movingItem.moved = true;

  let sortedLayout = sortLayoutItemsByRowCol(movedLayout);
  if (movingUp) sortedLayout = sortedLayout.reverse();
  const collisions = getAllCollisions(sortedLayout, movingItem);

  if (preventCollision && collisions.length) {
    (movingItem.x = oldX), (movingItem.y = oldY);
    movingItem.moved = false;
    return movedLayout;
  }

  for (let i = 0, len = collisions.length; i < len; i++) {
    const collision = collisions[i];

    // Short circuit so we can't infinite loop
    if (collision.moved) continue;

    // This makes it feel a bit more precise by waiting to swap for just a bit when moving up.
    if (movingItem.y > collision.y && movingItem.y - collision.y > collision.h / 4) continue;

    if (collision.static) {
      movedLayout = moveElementAwayFromCollision(movedLayout, collision, movingItem, isUserAction);
    } else {
      movedLayout = moveElementAwayFromCollision(movedLayout, movingItem, collision, isUserAction);
    }
  }
  return movedLayout;
}

export function compactItem(compareWith: GridItem[], item: GridItem, verticalCompact: boolean) {
  if (verticalCompact) {
    while (item.y > 0 && getFirstCollision(compareWith, item)) {
      item.y--;
    }
  }
  let collides;
  while ((collides = getFirstCollision(compareWith, item))) {
    item.y = collides.y + collides.h;
  }
  return item;
}

export function compact(layout: GridItem[], verticalCompact: boolean) {
  const compareWith = getStatics(layout);
  const sortedLayout = sortLayoutItemsByRowCol(layout);
  const length = sortedLayout.length;
  const compactedLayout = new Array(length);
  for (let i = 0; i < length; i++) {
    let item = sortedLayout[i];
    if (!item.static) {
      item = compactItem(compareWith, item, verticalCompact);
      compareWith.push(item);
    }
    compactedLayout[layout.indexOf(item)] = item;
    item.moved = false;
  }
  return compactedLayout;
}

export function setTransform(top: number, left: number, width: number, height: number) {
  const translate = `translate3d(${left}px, ${top}px, 0)`;
  return {
    transform: translate,
    // old webkit
    WebkitTransform: translate,
    // Firefox
    MozTransform: translate,
    // IE
    msTransform: translate,
    // Opera
    OTransform: translate,
    width: `${width}px`,
    height: `${height}px`,
    position: 'absolute',
  };
}

export function setTopLeft(top: number, left: number, width: number, height: number) {
  return {
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    height: `${height}px`,
    position: 'absolute',
  };
}

export function bottom(layout: GridItem[]) {
  let max = 0,
    bottomY;
  for (let i = 0, len = layout.length; i < len; i++) {
    bottomY = layout[i].y + layout[i].h;
    if (bottomY > max) max = bottomY;
  }
  return max;
}
