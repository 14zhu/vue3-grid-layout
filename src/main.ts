import { createApp } from 'vue';
import App from './App.vue';
import components from './components';
import './style.css';

const app = createApp(App);
app.use(components);
app.mount('#app');
