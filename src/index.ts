import { rand, randFloat } from "./math";
import { NUM_LINES, LINE_DIMS } from "./constants";
import { default as createMixer } from "./mixer";
import { default as createSynth } from "./synth";
import { default as createSeq, play } from "./sequencer";
import { default as loop } from "./audioloop";

import "./style.css";

let canvas;
let width;
let height;
let ctx;
const context = {
  lines: null,
  mixer: null,
  sequencer: null,
  tempo: 120,
  instances: null,
};

type BlockProps = {
  velocity?: number;
  note?: number;
};

const createBlock = (props: BlockProps) => {
  return {
    ...props,
  };
};

const randomizeBlocks = () => {
  const lines = [];
  context.instances = [];
  for (let i = 0; i < NUM_LINES; ++i) {
    const instance = createSynth(context.mixer.ctx);
    instance.output.connect(context.mixer.tracks[i].gain);
    context.instances.push(instance);
    instance.start();
    const blocks = [];
    const len = rand(LINE_DIMS[0], LINE_DIMS[1]);
    for (let x = 0; x < len; ++x) {
      const props: BlockProps = {};
      if (rand(0, 100) > 70) {
        props.velocity = randFloat(0.1, 1.0);
        const root = 32 + i * 6;
        props.note = rand(root, root + 4 * 12);
      }
      blocks.push(createBlock(props));
    }
    lines.push(blocks);
  }
  context.lines = lines;
};

const randomize = () => {
  randomizeBlocks();
};

function step() {
  const currentNote = context.sequencer.currentNote;
  const blockWidth = (width * 0.9) / LINE_DIMS[1];
  for (let i = 0; i < NUM_LINES; ++i) {
    const blocks = context.lines[i];
    const currentLineIndex = Math.floor(currentNote / 4) % blocks.length;
    for (let x = 0; x < blocks.length; ++x) {
      if (blocks[x].velocity) {
        const color = blocks[x].velocity * 255;
        const current = currentLineIndex === x;
        ctx.fillStyle = `rgb(${color}, ${current ? 255 - color : color}, ${
          current ? 255 - color : color
        })`;
        ctx.fillRect(x * blockWidth, i * blockWidth, blockWidth, blockWidth);
      }
      ctx.strokeRect(x * blockWidth, i * blockWidth, blockWidth, blockWidth);
    }
  }

  window.requestAnimationFrame(step);
}

const draw = () => {
  window.requestAnimationFrame(step);
};

const start = () => {
  randomize();
  draw();
};

function onResize() {
  width = window.innerWidth * 0.95;
  height = window.innerHeight * 0.95;
  canvas.width = width;
  canvas.height = height;
}

const setupCanvas = () => {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  ctx.lineWidth = "3px";
  window.addEventListener("resize", onResize);
  onResize();
};

const setupAudio = () => {
  context.mixer = createMixer();
  context.sequencer = createSeq();
};

const playAudio = () => {
  loop(context);
  play(context.sequencer);
};

const firstStart = () => {
  window.removeEventListener("click", firstStart);
  window.removeEventListener("keydown", firstStart);
  playAudio();
};

const setupEvents = () => {
  if (process.env["NODE_ENV"] === "development") {
    playAudio();
  } else {
    window.addEventListener("click", firstStart);
    window.addEventListener("keydown", firstStart);
  }
};

const main = () => {
  setupCanvas();
  setupAudio();
  start();
  setupEvents();
};

main();
