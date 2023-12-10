<template>
  <div ref="item" class="vue-grid-item" :class="classObj" :style="style">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { Interactable } from '@interactjs/core/Interactable';
import interact from 'interactjs';
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import emitter from '../utils/event';

import { setTopLeft, setTransform } from '../utils';
import { createMoveData, getControlPosition, getNewPosition } from '../utils/draggableUtils';

type GridItemProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  i: string;
};

const props = defineProps<GridItemProps>();

const emits = defineEmits<{
  move: [i: string, x: number, y: number];
  moved: [i: string, x: number, y: number];
}>();

const colNum: number = inject('colNum', 12);
const rowHeight: number = inject('rowHeight', 30);
const margin: number[] = inject('margin', [0, 0]);
const transformScale: number = inject('transformScale', 1);
const useCssTransforms: boolean = inject('useCssTransforms', false);
const containerWidth = inject('containerWidth', ref(1280));

const item = ref<HTMLElement | null>(null);
const style = ref<Record<string, string>>({
  left: '0px',
  top: '0px',
  width: '0px',
  height: '0px',
});
const interactIns = ref<Interactable | null>(null);
const innerX = ref(props.x);
const innerY = ref(props.y);
const innerW = ref(props.w);
const innerH = ref(props.h);
const maxRows = ref(Infinity);
const dragging = ref<{ left: number; top: number } | null>(null);
const isDragging = ref(false);
const lastX = ref(NaN);
const lastY = ref(NaN);
const previousX = ref<number | null>(null);
const previousY = ref<number | null>(null);
const gridLayoutWidth = ref(1280);

const colWidth = computed(() => {
  return (gridLayoutWidth.value - margin[0] * (colNum + 1)) / colNum;
});
const classObj = computed(() => {
  return {
    'vue-draggable-dragging': isDragging.value,
  };
});

watch(
  () => containerWidth.value,
  (newVal: number) => {
    gridLayoutWidth.value = newVal;
  }
);
watch(
  () => props.x,
  (newVal: number) => {
    innerX.value = newVal;
    createStyle();
  }
);
watch(
  () => props.y,
  (newVal: number) => {
    innerY.value = newVal;
    createStyle();
  }
);
watch(
  () => props.w,
  (newVal: number) => {
    innerW.value = newVal;
    createStyle();
  }
);
watch(
  () => props.h,
  (newVal: number) => {
    innerH.value = newVal;
    createStyle();
  }
);

const calcPosition = (x: number, y: number, w: number, h: number) => {
  return {
    left: Math.round(colWidth.value * x + (x + 1) * margin[0]),
    top: Math.round(rowHeight * y + (y + 1) * margin[1]),
    width: w === Infinity ? w : Math.round(colWidth.value * w + Math.max(0, w - 1) * margin[0]),
    height: h === Infinity ? h : Math.round(rowHeight * h + Math.max(0, h - 1) * margin[1]),
  };
};

const calcXY = (left: number, top: number) => {
  let x = Math.round((left - margin[0]) / (colWidth.value + margin[0]));
  let y = Math.round((top - margin[1]) / (rowHeight + margin[1]));
  x = Math.max(0, Math.min(x, colNum - innerW.value));
  y = Math.max(0, Math.min(y, maxRows.value - innerH.value));
  return { x, y };
};

const handleDrag = (event: MouseEvent) => {
  const { i } = props;
  const { x, y } = getControlPosition(event);
  let newPosition = { left: 0, top: 0 };
  switch (event.type) {
    case 'dragstart':
      previousX.value = innerX.value;
      previousY.value = innerY.value;
      newPosition = getNewPosition(event, transformScale);
      dragging.value = newPosition;
      isDragging.value = true;
      break;
    case 'dragend':
      if (!isDragging.value) return;
      newPosition = getNewPosition(event, transformScale);
      dragging.value = null;
      isDragging.value = false;
      break;
    case 'dragmove':
      const moveData = createMoveData(lastX.value, lastY.value, x, y);
      console.log('dragmove', lastX.value, x, moveData.deltaX);
      newPosition.left = (dragging.value!.left + moveData.deltaX) / transformScale;
      newPosition.top = (dragging.value!.top + moveData.deltaY) / transformScale;
      console.log(dragging.value!.left, moveData.deltaX);
      dragging.value = { left: newPosition.left, top: newPosition.top };
      break;
  }
  const pos = calcXY(newPosition.left, newPosition.top);
  lastX.value = x;
  lastY.value = y;
  if (innerX.value !== pos.x || innerY.value !== pos.y) {
    emits('move', i, pos.x, pos.y);
  }
  if (event.type === 'dragend' && (previousX.value !== innerX.value || previousY.value !== innerY.value)) {
    emits('moved', i, pos.x, pos.y);
  }
  emitter.emit('drag', { eventName: event.type, i, x: pos.x, y: pos.y, w: innerW.value, h: innerH.value });
};

const createStyle = () => {
  const { x, w } = props;
  if (x + w > colNum) {
    innerX.value = 0;
    innerW.value = w > colNum ? colNum : w;
  } else {
    innerX.value = x;
    innerW.value = w;
  }
  let pos = calcPosition(innerX.value, innerY.value, innerW.value, innerH.value);
  if (isDragging.value) {
    pos.top = dragging.value!.top;
    pos.left = dragging.value!.left;
  }
  let customStyle;
  if (useCssTransforms) {
    customStyle = setTransform(pos.top, pos.left, pos.width, pos.height);
  } else {
    customStyle = setTopLeft(pos.top, pos.left, pos.width, pos.height);
  }
  style.value = customStyle;
};

onMounted(() => {
  console.log('onMounted');
  createStyle();
  interactIns.value = interact(item.value!);
  interactIns.value.draggable(true);
  interactIns.value.on('dragstart dragmove dragend', (event) => {
    handleDrag(event);
  });
  emitter.on('compact', createStyle);
});
onBeforeUnmount(() => {
  interactIns.value?.unset();
  emitter.off('compact');
});
</script>

<style scoped>
.vue-grid-item {
  position: absolute;
}
.vue-grid-item {
  background-color: rgba(100, 100, 100, 1);
}

.vue-grid-item.vue-draggable-dragging {
  transition: none;
  z-index: 3;
}

.vue-grid-item.vue-grid-placeholder {
  background: green;
  opacity: 0.2;
  transition-duration: 100ms;
  z-index: 2;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -o-user-select: none;
  user-select: none;
}
</style>
