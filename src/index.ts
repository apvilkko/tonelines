import { rand, randFloat, sample, randLog } from "./math";
import { NUM_LINES, LINE_DIMS, MAX_LINES } from "./constants";
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
  muted: {},
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

const DEBUG = null;
const numLines = DEBUG ? 1 : NUM_LINES;

const OSCTYPES = ["sine", "square", "sawtooth", "triangle"];
const MELLOW_OSCTYPES = ["sine", "triangle"];

const setupInstrument = (i) => {
  let variant = DEBUG ? DEBUG : sample(Object.values(VARIANTS));
  const instance = createSynth(context.mixer.ctx);
  switch (variant) {
    case MEGARANDOM: {
      instance.setParam("oscType0", sample(OSCTYPES));
      instance.setParam("oscType1", sample(OSCTYPES));
      instance.setParam("oscFreq0", randLog(20, 6000));
      instance.setParam("vcaGain0", randFloat(0.05, 0.4));
      instance.setParam("vcaGain1", randFloat(0.05, 0.4));
      instance.setParam("vcaGain2", randFloat(0.05, 0.4));
      instance.setParam("aEnvAttack", randFloat(0, 0.05));
      instance.setParam("aEnvDecay", randFloat(0.1, 2.0));
      instance.setParam("aEnvSustain", 0.01);
      instance.setParam("fEnvAttack", randFloat(0, 0.05));
      instance.setParam("fEnvRelease", randFloat(0.1, 2));
      instance.setParam("pLevel", randLog(0, 1000));
      instance.setParam("pDecay", randFloat(0.01, 0.5));
      instance.setParam("filterType", sample(["highpass", "lowpass"]));
      instance.setParam("filterFreq", randLog(150, 6000));
      instance.setParam("filterQ", randFloat(2, 15));
      break;
    }
    case SN: {
      instance.setParam("oscType0", sample(OSCTYPES));
      instance.setParam("oscFreq0", randLog(100, 250));
      instance.setParam("vcaGain1", 0);
      instance.setParam("vcaGain2", randFloat(0.4, 0.6));
      instance.setParam("aEnvAttack", 0);
      instance.setParam("aEnvDecay", randFloat(0.1, 1.0));
      instance.setParam("aEnvSustain", 0.01);
      instance.setParam("fEnvAttack", 0);
      instance.setParam("fEnvRelease", randFloat(0.2, 2));
      instance.setParam("pLevel", randLog(50, 500));
      instance.setParam("pDecay", randFloat(0.05, 0.2));
      instance.setParam("filterFreq", randLog(1500, 5000));
      instance.setParam("filterQ", randFloat(2, 15));
      break;
    }
    case KICK: {
      const type = sample(OSCTYPES);
      instance.setParam("oscType0", type);
      instance.setParam("oscFreq0", randLog(20, 80));
      instance.setParam("vcaGain1", 0);
      instance.setParam("vcaGain2", randFloat(0, 0.15));
      instance.setParam("aEnvAttack", 0);
      instance.setParam("aEnvDecay", randFloat(0.12, 1.0));
      instance.setParam("aEnvSustain", 0.01);
      instance.setParam("fEnvAttack", 0);
      instance.setParam("fEnvRelease", 1.0);
      instance.setParam("pLevel", randLog(80, 500));
      instance.setParam("pDecay", randFloat(0.05, 0.2));
      instance.setParam(
        "filterFreq",
        type === "sawtooth" ? randLog(200, 800) : randLog(200, 2500)
      );
      instance.setParam("filterQ", randFloat(2, 9));
      break;
    }
    case CONGA: {
      instance.setParam("oscType0", sample(MELLOW_OSCTYPES));
      instance.setParam("oscFreq0", randLog(150, 1500));
      instance.setParam("vcaGain1", 0);
      instance.setParam("vcaGain2", randFloat(0, 0.1));
      instance.setParam("aEnvAttack", 0);
      instance.setParam("aEnvDecay", randFloat(0.05, 0.3));
      instance.setParam("aEnvSustain", 0.01);
      instance.setParam("fEnvAttack", 0);
      instance.setParam("fEnvRelease", randFloat(0.1, 1.0));
      instance.setParam("pLevel", randLog(0, 100));
      instance.setParam("pDecay", randFloat(0.05, 0.1));
      instance.setParam("filterFreq", randLog(500, 2000));
      instance.setParam("filterQ", randFloat(2, 15));
      break;
    }
    case HH: {
      const type = sample(["highpass", "bandpass"]);
      instance.setParam("oscType0", sample(OSCTYPES));
      instance.setParam("oscFreq0", randLog(4000, 8000));
      instance.setParam("vcaGain0", 0.3);
      instance.setParam("vcaGain1", 0);
      instance.setParam("vcaGain2", type === "bandpass" ? 0.5 : 0.4);
      instance.setParam("filterType", type);
      instance.setParam("filterFreq", randLog(4000, 9000));
      instance.setParam("filterQ", randFloat(5, 15));
      instance.setParam("aEnvAttack", 0);
      instance.setParam("aEnvDecay", randFloat(0.05, 0.5));
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

const removeIndex = (i, arr) => [...arr.slice(0, i), ...arr.slice(i + 1)];

const removeLine = (i) => {
  cleanupInstrument(i);
  for (let j = i + 1; j < context.lines.length; ++j) {
    const instance = context.instances[j];
    instance.output.disconnect(context.mixer.tracks[j].gain);
  }
  context.lines = removeIndex(i, context.lines);
  context.instances = removeIndex(i, context.instances);
  for (let j = i; j < context.lines.length; ++j) {
    const instance = context.instances[j];
    instance.output.connect(context.mixer.tracks[j].gain);
  }
};

const cleanup = () => {
  context.flags.clear = true;
  for (let i = 0; i < (context.lines || []).length; ++i) {
    cleanupInstrument(i);
  }
  context.lines = [];
  context.instances = [];
};

const addLine = (index?: number) => {
  const i = typeof index === "undefined" ? context.lines.length : index;
  setupInstrument(i);
  const blocks = [];
  const len = DEBUG ? 8 : rand(LINE_DIMS[0], LINE_DIMS[1]);
  for (let x = 0; x < len; ++x) {
    const props: BlockProps = {};
    if (rand(0, 100) > (DEBUG ? 30 : 70)) {
      props.velocity = randFloat(0.5, 1.0);
      const root = 32 + i * 6;
      props.note = rand(root, root + 4 * 12);
    }
    blocks.push(createBlock(props));
  }
  context.lines.push(blocks);
};

const randomizeBlocks = () => {
  context.lines = [];
  context.instances = [];
  for (let i = 0; i < numLines; ++i) {
    addLine(i);
  }
};

const randomize = () => {
  pause(context.sequencer);
  cleanup();
  randomizeBlocks();
  context.tempo = rand(80, 180);
  reset(context.sequencer);
  play(context.sequencer);
};

const getBlockWidth = () => (width * 0.9) / LINE_DIMS[1];

const getButtonsDims = (lineIndex, buttonIndex) => {
  const blockWidth = getBlockWidth();
  const buttonWidth = blockWidth / 2;
  return [
    0 + buttonIndex * buttonWidth,
    lineIndex * blockWidth + buttonWidth,
    buttonWidth,
    buttonWidth,
  ];
};

function strokeStar(x, y, r, n, inset) {
  ctx.save();
  ctx.beginPath();
  ctx.translate(x, y);
  ctx.moveTo(0, 0 - r);
  for (let i = 0; i < n; i++) {
    ctx.rotate(Math.PI / n);
    ctx.lineTo(0, 0 - r * inset);
    ctx.rotate(Math.PI / n);
    ctx.lineTo(0, 0 - r);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function step() {
  if (context.flags.clear) {
    ctx.clearRect(0, 0, width, height);
    context.flags.clear = false;
  } else {
    const currentNote = context.sequencer.currentNote;
    const blockWidth = getBlockWidth();
    for (let i = 0; i <= context.lines.length; ++i) {
      if (i === context.lines.length && context.lines.length < MAX_LINES) {
        // Add line button
        const dims = getButtonsDims(i, ADD_REMOVE);
        ctx.beginPath();
        const r = dims[2] / 2;
        ctx.arc(dims[0] + r, dims[1] + r, r, 0, 2 * Math.PI, false);
        ctx.strokeStyle = "black";
        ctx.stroke();
      } else {
        const blocks = context.lines[i];
        if (!blocks) {
          continue;
        }
        const currentLineIndex = Math.floor(currentNote / 4) % blocks.length;

        let dims = getButtonsDims(i, ADD_REMOVE);
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(dims[0], dims[1] + dims[3]);
        ctx.lineTo(dims[0] + dims[2] / 2, dims[1]);
        ctx.lineTo(dims[0] + dims[2], dims[1] + dims[3]);
        ctx.lineTo(dims[0], dims[1] + dims[3]);
        ctx.closePath();
        ctx.stroke();

        dims = getButtonsDims(i, MUTE);
        const r = dims[2] / 2;
        strokeStar(dims[0] + r, dims[1] + r, r, 5, 0.81);

        const alpha = context.muted[i] ? 0.1 : 1;
        for (let x = 0; x < blocks.length; ++x) {
          if (blocks[x].velocity) {
            const color = 256 - blocks[x].velocity * 255;
            const current = currentLineIndex === x;
            const secColor = current ? 128 - color / 2 : color;
            ctx.fillStyle = `rgba(${color}, ${secColor}, ${secColor}, ${alpha})`;
            ctx.fillRect(
              (x + 1) * blockWidth,
              i * blockWidth,
              blockWidth,
              blockWidth
            );
          }

          ctx.strokeStyle = context.muted[i]
            ? `rgba(220,220,220,${alpha})`
            : "black";
          ctx.strokeRect(
            (x + 1) * blockWidth,
            i * blockWidth,
            blockWidth,
            blockWidth
          );
        }
        if (context.muted[i]) {
          ctx.fillStyle = `rgba(255,255,255, 0.2)`;
          ctx.fillRect(
            blockWidth,
            i * blockWidth,
            blocks.length * blockWidth,
            blockWidth
          );
        }
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

const togglePause = () => {
  const seq = context.sequencer;
  seq.playing ? pause(seq) : play(seq);
};

const setupButton = (id, fn) => {
  const button = document.getElementById(id);
  if (button) {
    button.addEventListener("click", fn);
  }
};

const ADD_REMOVE = 0;
const MUTE = 1;
const ACTIONS = [ADD_REMOVE, MUTE];

const delegateAction = (lineIndex, action) => {
  let clear = false;
  switch (action) {
    case MUTE: {
      context.muted[lineIndex] = !context.muted[lineIndex];
      break;
    }
    case ADD_REMOVE: {
      pause(context.sequencer);
      if (
        lineIndex === context.lines.length &&
        context.lines.length < MAX_LINES
      ) {
        clear = true;
        addLine();
      } else if (lineIndex >= 0 && lineIndex < context.lines.length) {
        clear = true;
        removeLine(lineIndex);
      }
      play(context.sequencer);
      break;
    }
    default:
      break;
  }
  if (clear) {
    context.flags.clear = true;
  }
};

const delegateEvent = (evt, x, y) => {
  for (let i = 0; i <= context.lines.length; ++i) {
    ctx.fillStyle = "black";
    for (let j = 0; j < ACTIONS.length; ++j) {
      const dims = getButtonsDims(i, j);
      if (
        x > dims[0] &&
        x < dims[0] + dims[2] &&
        y > dims[1] &&
        y < dims[1] + dims[3]
      ) {
        evt.preventDefault();
        delegateAction(i, j);
      }
    }
  }
};

const handleCanvasEvent = (evt) => {
  if (evt.buttons === 0 || evt.buttons === 1) {
    const rect = canvas.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    delegateEvent(evt, x, y);
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
  setupButton("pause", togglePause);
  if (canvas) {
    canvas.addEventListener("mousedown", handleCanvasEvent);
  }
};

const main = () => {
  setupCanvas();
  setupAudio();
  start();
  setupEvents();
};

main();
