<template>
  <div ref="item" class="vue-grid-layout" id="vue-grid-layout" :style="mergedStyle">
    <slot></slot>
    <grid-item class="vue-grid-placeholder" v-show="isDragging" :x="placeholder.x" :y="placeholder.y" :w="placeholder.w" :h="placeholder.h" :i="placeholder.i"></grid-item>
  </div>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core';
import { nextTick, onBeforeUnmount, onMounted, provide, ref } from 'vue';
import type { GridItem } from '../types';
import { bottom, compact, moveElement } from '../utils';
import emitter from '../utils/event';

type Props = {
  modelValue: Array<GridItem>;
  colNum?: number;
  rowHeight?: number;
  margin?: [number, number];
  preventCollision?: boolean;
  verticalCompact?: boolean;
  autoSize?: boolean;
  useCssTransforms?: boolean;
  transformScale?: number;
};

const props = withDefaults(defineProps<Props>(), {
  colNum: 20,
  rowHeight: 30,
  margin: () => [10, 10],
  preventCollision: false,
  verticalCompact: true,
  autoSize: true,
  useCssTransforms: false,
  transformScale: 1,
});

const emits = defineEmits<{
  'update:modelValue': [GridItem[]];
}>();

const layout = useVModel(props, 'modelValue', emits);
const item = ref<HTMLElement | null>(null);
const placeholder = ref({
  x: 2,
  y: 2,
  w: 1,
  h: 1,
  i: 'placeholder',
});
const isDragging = ref(false);
const positionsBeforeDrag = ref<Record<string, { x: number; y: number }> | null>(null);
const mergedStyle = ref({});
const containerWidth = ref(0);

const onWindowResize = () => {
  containerWidth.value = item.value?.offsetWidth || 0;
  // emit resize event
};

const containerHeight = () => {
  const { rowHeight, margin, autoSize } = props;
  if (!autoSize) return;
  const containerHeight = bottom(layout.value) * (rowHeight + margin[1]) + margin[1];
  return `${containerHeight}px`;
};

const updateHeight = () => {
  mergedStyle.value = { height: containerHeight() };
};

const dragEvent = ({ eventName, i, x, y, w, h }: { eventName: string; i: string; x: number; y: number; w: number; h: number }) => {
  const gridItem = layout.value.find((item) => item.i === i);
  // todo GetLayoutItem sometimes returns null object
  if (!gridItem) return;
  if (eventName === 'dragstart') {
    let result: Record<string, { x: number; y: number }> = {};
    layout.value.forEach((item) => {
      result[i] = { x: item.x, y: item.y };
    });
    positionsBeforeDrag.value = result;
  }
  // console.log(x, y, gridItem.x, gridItem.y);
  if (eventName === 'dragmove' || eventName === 'dragstart') {
    placeholder.value = { ...placeholder.value, i, x: gridItem.x, y: gridItem.y, w, h };
    nextTick(() => {
      isDragging.value = true;
    });
    // emit updateWidth
  } else {
    nextTick(() => {
      isDragging.value = false;
    });
  }
  // Move the element to the dragged location.
  layout.value = moveElement(layout.value, gridItem, x, y, true, props.preventCollision);
  compact(layout.value, props.verticalCompact);
  emitter.emit('compact');
  updateHeight();
};

provide('colNum', props.colNum);
provide('rowHeight', props.rowHeight);
provide('margin', props.margin);
provide('transformScale', props.transformScale);
provide('useCssTransforms', props.useCssTransforms);
provide('containerWidth', containerWidth);

onMounted(() => {
  emitter.on('drag', dragEvent);
  onWindowResize();
  window.addEventListener('resize', onWindowResize);
  compact(layout.value, props.verticalCompact);
  updateHeight();
  // todo element-resize-detector
});
onBeforeUnmount(() => {
  emitter.off('drag', dragEvent);
  window.removeEventListener('resize', onWindowResize);
});
</script>

<style scoped>
.vue-grid-layout {
  width: 100%;
  min-height: 200px;
  position: relative;
}
</style>
