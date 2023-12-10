<script lang="ts" setup>
import { ref } from 'vue';

const layout = ref([
  {
    x: 1,
    y: 1,
    w: 1,
    h: 1,
    i: '1',
  },
  {
    x: 3,
    y: 3,
    w: 2,
    h: 2,
    i: '2',
  },
]);
</script>

<template>
  <grid-layout v-model="layout" :colNum="20" :rowHeight="30" :useCssTransforms="true">
    <grid-item v-for="item in layout" :key="item.i" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i">{{ item.i }}</grid-item>
  </grid-layout>
</template>

<style scoped></style>
