import mitt from 'mitt';

type Events = {
  drag: { eventName: string; i: string; x: number; y: number; w: number; h: number };
  compact: void;
};

const emitter = mitt<Events>();

export default emitter;
