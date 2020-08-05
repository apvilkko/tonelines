import compressor from "./compressor";
import { MAX_LINES } from "./constants";

const create = () => {
  const ctx = new window.AudioContext();

  const masterLimiter = compressor(ctx, { ratio: 20.0, knee: 0 });
  masterLimiter.output.connect(ctx.destination);

  const masterGain = ctx.createGain();
  masterGain.connect(masterLimiter.input);
  masterGain.gain.value = 0.7;

  const tracks = {};
  for (let i = 0; i < MAX_LINES; ++i) {
    const gain = ctx.createGain();
    gain.connect(masterGain);
    gain.gain.value = 0.7;
    tracks[i] = {
      gain,
    };
  }

  return {
    ctx,
    masterGain,
    input: masterGain,
    tracks,
  };
};

export default create;
