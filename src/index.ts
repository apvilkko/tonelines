import { rand, randFloat, sample } from "./math";
import { NUM_LINES, LINE_DIMS } from "./constants";
import { default as createMixer } from "./mixer";
import { default as createSynth } from "./synth";
import { default as createSeq, play, pause, reset } from "./sequencer";
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
  flags: {
    clear: false,
  },
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

const TONE = "tope";
const HH = "hh";
const KICK = "kick";
const SN = "snare";
const CONGA = "conga";
const MEGARANDOM = "megarandom";
const VARIANTS = {
  MEGARANDOM,
  TONE,
  CONGA,
  HH,
  KICK,
  SN,
};

const OSCTYPES = ["sine", "square", "sawtooth", "triangle"];

const setupInstrument = (i) => {
  let variant = sample(Object.values(VARIANTS));
  const instance = createSynth(context.mixer.ctx);
  switch (variant) {
    case MEGARANDOM: {
      instance.setParam("oscType0", sample(OSCTYPES));
      instance.setParam("oscType1", sample(OSCTYPES));
      instance.setParam("oscFreq0", randFloat(20, 6000));
      instance.setParam("vcaGain0", randFloat(0.05, 0.4));
      instance.setParam("vcaGain1", randFloat(0.05, 0.4));
      instance.setParam("vcaGain2", randFloat(0.05, 0.4));
      instance.setParam("aEnvAttack", randFloat(0, 0.05));
      instance.setParam("aEnvDecay", randFloat(0.1, 2.0));
      instance.setParam("aEnvSustain", 0.01);
      instance.setParam("fEnvAttack", randFloat(0, 0.05));
      instance.setParam("fEnvRelease", randFloat(0.1, 2));
      instance.setParam("pLevel", randFloat(0, 1000));
      instance.setParam("pDecay", randFloat(0.01, 0.5));
      instance.setParam("filterType", sample(["highpass", "lowpass"]));
      instance.setParam("filterFreq", randFloat(150, 6000));
      instance.setParam("filterQ", randFloat(2, 15));
      break;
    }
    case SN: {
      instance.setParam("oscType0", sample(OSCTYPES));
      instance.setParam("oscType1", sample(OSCTYPES));
      instance.setParam("oscFreq0", randFloat(80, 200));
      instance.setParam("vcaGain1", 0);
      instance.setParam("vcaGain2", randFloat(0.4, 0.6));
      instance.setParam("aEnvAttack", 0);
      instance.setParam("aEnvDecay", randFloat(0.1, 1.0));
      instance.setParam("aEnvSustain", 0.01);
      instance.setParam("fEnvAttack", 0);
      instance.setParam("fEnvRelease", randFloat(0.5, 2));
      instance.setParam("pLevel", randFloat(50, 1000));
      instance.setParam("pDecay", randFloat(0.05, 0.2));
      instance.setParam("filterFreq", randFloat(1500, 5000));
      instance.setParam("filterQ", randFloat(2, 15));
      break;
    }
    case KICK: {
      instance.setParam("oscType0", sample(OSCTYPES));
      instance.setParam("oscType1", sample(OSCTYPES));
      instance.setParam("oscFreq0", randFloat(50, 120));
      instance.setParam("vcaGain1", 0);
      instance.setParam("vcaGain2", randFloat(0, 0.2));
      instance.setParam("aEnvAttack", 0);
      instance.setParam("aEnvDecay", randFloat(0.1, 1.0));
      instance.setParam("aEnvSustain", 0.01);
      instance.setParam("fEnvAttack", 0);
      instance.setParam("fEnvRelease", 1.0);
      instance.setParam("pLevel", randFloat(50, 500));
      instance.setParam("pDecay", randFloat(0.05, 0.2));
      instance.setParam("filterFreq", randFloat(200, 1000));
      instance.setParam("filterQ", randFloat(2, 9));
      break;
    }
    case CONGA: {
      instance.setParam("oscType0", sample(OSCTYPES));
      instance.setParam("oscType1", sample(OSCTYPES));
      instance.setParam("oscFreq0", randFloat(150, 1500));
      instance.setParam("vcaGain1", 0);
      instance.setParam("vcaGain2", randFloat(0, 0.1));
      instance.setParam("aEnvAttack", 0);
      instance.setParam("aEnvDecay", randFloat(0.1, 0.3));
      instance.setParam("aEnvSustain", 0.01);
      instance.setParam("fEnvAttack", 0);
      instance.setParam("fEnvRelease", randFloat(0.1, 1.0));
      instance.setParam("pLevel", randFloat(0, 80));
      instance.setParam("pDecay", randFloat(0.05, 0.1));
      instance.setParam("filterFreq", randFloat(500, 1500));
      instance.setParam("filterQ", randFloat(2, 15));
      break;
    }
    case HH: {
      instance.setParam("oscType0", sample(OSCTYPES));
      instance.setParam("oscType1", sample(OSCTYPES));
      instance.setParam("oscFreq0", randFloat(4000, 8000));
      instance.setParam("vcaGain0", 0.3);
      instance.setParam("vcaGain1", 0);
      instance.setParam("vcaGain2", 0.4);
      instance.setParam("filterType", "highpass");
      instance.setParam("filterFreq", randFloat(4000, 9000));
      instance.setParam("filterQ", randFloat(5, 15));
      instance.setParam("aEnvAttack", 0);
      instance.setParam("aEnvDecay", randFloat(0.05, 0.4));
      instance.setParam("aEnvSustain", 0.01);
      instance.setParam("fEnvAttack", 0);
      instance.setParam("fEnvRelease", 1.0);
      break;
    }
    default:
      instance.setParam("oscType0", sample(OSCTYPES));
      instance.setParam("oscType1", sample(OSCTYPES));
      instance.setParam("vcaGain2", 0);
      break;
  }
  instance.output.connect(context.mixer.tracks[i].gain);
  context.instances.push(instance);
  instance.start();
};

const cleanupInstrument = (i) => {
  if (!context.instances) return;
  const instance = context.instances[i];
  if (instance) {
    instance.stop();
    instance.cleanup();
    instance.output.disconnect(context.mixer.tracks[i].gain);
  }
};

const cleanup = () => {
  context.flags.clear = true;
  for (let i = 0; i < NUM_LINES; ++i) {
    cleanupInstrument(i);
  }
  context.lines = [];
  context.instances = [];
};

const randomizeBlocks = () => {
  const lines = [];
  context.instances = [];
  for (let i = 0; i < NUM_LINES; ++i) {
    setupInstrument(i);
    const blocks = [];
    const len = rand(LINE_DIMS[0], LINE_DIMS[1]);
    for (let x = 0; x < len; ++x) {
      const props: BlockProps = {};
      if (rand(0, 100) > 70) {
        props.velocity = randFloat(0.5, 1.0);
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
  pause(context.sequencer);
  cleanup();
  randomizeBlocks();
  context.tempo = rand(80, 180);
  reset(context.sequencer);
  play(context.sequencer);
};

function step() {
  if (context.flags.clear) {
    ctx.clearRect(0, 0, width, height);
    context.flags.clear = false;
  } else {
    const currentNote = context.sequencer.currentNote;
    const blockWidth = (width * 0.9) / LINE_DIMS[1];
    for (let i = 0; i < NUM_LINES; ++i) {
      const blocks = context.lines[i];
      const currentLineIndex = Math.floor(currentNote / 4) % blocks.length;
      for (let x = 0; x < blocks.length; ++x) {
        if (blocks[x].velocity) {
          const color = 256 - blocks[x].velocity * 255;
          const current = currentLineIndex === x;
          const secColor = current ? 128 - color / 2 : color;
          ctx.fillStyle = `rgb(${color}, ${secColor}, ${secColor})`;
          ctx.fillRect(x * blockWidth, i * blockWidth, blockWidth, blockWidth);
        }
        ctx.strokeRect(x * blockWidth, i * blockWidth, blockWidth, blockWidth);
      }
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

const setupButton = (id, fn) => {
  const button = document.getElementById(id);
  if (button) {
    button.addEventListener("click", fn);
  }
};

const setupEvents = () => {
  if (process.env["NODE_ENV"] === "development") {
    playAudio();
  } else {
    window.addEventListener("click", firstStart);
    window.addEventListener("keydown", firstStart);
  }
  setupButton("randomize", randomize);
};

const main = () => {
  setupCanvas();
  setupAudio();
  start();
  setupEvents();
};

main();
