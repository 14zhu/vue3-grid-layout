import { App } from 'vue';
import GridItem from './GridItem.vue';
import GridLayout from './GridLayout.vue';

export default {
  install: function (app: App) {
    app.component('grid-layout', GridLayout);
    app.component('grid-item', GridItem);
  },
};
