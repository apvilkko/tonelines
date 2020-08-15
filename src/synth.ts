import createVco from "./vco";
import { noteToFreq } from "./math";
import { ads, r } from "./envelope";

const createNoiseBuffer = (ctx) => {
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
};

const create = (ctx) => {
  const vcos = [createVco(ctx), createVco(ctx)];
  const vcas = [ctx.createGain(), ctx.createGain(), ctx.createGain()];
  const freqs = [0, 0];
  const maxGains = [0.5, 0.5, 0.5];
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx);
  noise.loop = true;
  noise.start();

  const output = ctx.createGain();
  output.gain.value = 0.6;

  const eq = ctx.createBiquadFilter();
  eq.type = "peaking";
  eq.Q.value = 1;
  eq.frequency.value = 100;
  eq.gain.value = 0;
  eq.connect(output);

  let fFrequency = 1000;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 3;
  filter.frequency.value = fFrequency;
  filter.connect(eq);

  let fEnvAttack = 0.05;
  let fEnvAmount = 1200;
  let fEnvRelease = 0.1;

  let aAttack = 0.003;
  let aDecay = 0.2;
  let aSustain = 0.5;
  let aRelease = 0.05;

  let pLevel = 0;
  let pAttack = 0;
  let pDecay = 0;
  let pSustain = 0;
  let pRelease = 0;

  vcas.forEach((vca) => {
    vca.gain.value = 0;
    vca.connect(filter);
  });

  for (let i = 0; i < vcos.length; ++i) {
    vcos[i].output.connect(vcas[i]);
  }
  noise.connect(vcas[vcas.length - 1]);

  const noteOn = (note, atTime) => {
    const time = atTime || ctx.currentTime;
    vcos.forEach((vco, i) => {
      const freq = freqs[i] ? freqs[i] : noteToFreq(note.note, vco.detune);
      vco.setFreq(freq, atTime);
      if (i === 0 && pLevel) {
        ads(
          vco.osc.frequency,
          time,
          freq,
          freq + pLevel,
          pAttack,
          pDecay,
          freq + pSustain
        );
      }
    });

    vcas.forEach((vca, i) => {
      if (maxGains[i]) {
        ads(
          vca.gain,
          time,
          0,
          maxGains[i] * note.velocity,
          aAttack,
          aDecay,
          maxGains[i] * aSustain * note.velocity
        );
      }
    });
    ads(
      filter.frequency,
      time,
      fFrequency,
      fFrequency + fEnvAmount,
      fEnvAttack,
      fEnvRelease,
      fFrequency
    );
  };

  const noteOff = (note, atTime) => {
    const time = atTime || ctx.currentTime;
    // console.log('noteOff', time, time + aRelease);
    vcas.forEach((vca) => {
      r(vca.gain, time, aRelease);
    });
  };

  const paramHandlers = {
    filterFreq: (value, time?) => {
      fFrequency = value;
      filter.frequency.setValueAtTime(value, time);
    },
    filterQ: (value, time?) => filter.Q.setValueAtTime(value, time),
    filterType: (value) => {
      filter.type = value;
    },
    pLevel: (value) => {
      pLevel = value;
    },
    pDecay: (value) => {
      pDecay = value;
    },
    aEnvAttack: (value) => {
      aAttack = value;
    },
    aEnvDecay: (value) => {
      aDecay = value;
    },
    aEnvSustain: (value) => {
      aSustain = value;
    },
    aEnvRelease: (value) => {
      aRelease = value;
    },
    fEnvRelease: (value) => {
      fEnvRelease = value;
    },
    eqFrequency: (value) => {
      eq.frequency.value = value;
    },
    eqGain: (value) => {
      eq.gain.value = value;
    },
    eqType: (value) => {
      eq.type = value;
    },
    eqQ: (value) => {
      eq.Q.value = value;
    },
  };

  const start = () => {
    vcos.forEach((vco) => vco.start());
  };

  const stop = () => {
    vcos.forEach((vco) => vco.stop());
  };

  const cleanup = () => {
    vcas.forEach((vca) => {
      vca.disconnect(filter);
    });
    eq.disconnect(output);
    noise.stop();
  };

  const setParam = (param, value, atTime?: number) => {
    const time = atTime || ctx.currentTime;
    let match;
    if (paramHandlers[param]) {
      paramHandlers[param](value, time);
    } else if ((match = param.match(/vcaGain(\d)/))) {
      maxGains[match[1]] = value;
    } else if ((match = param.match(/detune(\d)/))) {
      vcos[match[1]].setDetune(value);
    } else if ((match = param.match(/oscType(\d)/))) {
      vcos[match[1]].setOscType(value);
    } else if ((match = param.match(/oscFreq(\d)/))) {
      freqs[match[1]] = value;
    } else if ((match = param.match(/lfoAmount(\d)/))) {
      vcos[match[1]].setLfoAmount(value);
    } else if ((match = param.match(/oscOn(\d)/))) {
      vcos[match[1]][value ? "start" : "stop"]();
    }
  };

  return {
    vcos,
    vcas,
    output,
    filter,

    noteOn,
    noteOff,
    setParam,
    start,
    stop,
    cleanup,
  };
};

export default create;
