const TUNING = 440;
const A4 = 69;

const rand = (min: number, max: number): number =>
  min + Math.floor(Math.random() * (max - min + 1));

const randFloat = (min, max) => min + Math.random() * (max - min);

const randLog = (min, max) => {
  const value = randFloat(0, 1);
  const minLog = Math.log(min);
  const maxLog = Math.log(max);
  return Math.exp(minLog + (maxLog - minLog) * value);
};

const noteToFreq = (note, detuneCents = 0) =>
  TUNING * Math.pow(2, (note - A4 + detuneCents / 100.0) / 12.0);

const sample = (arr: Array<any>) =>
  arr.length > 0 ? arr[rand(0, arr.length - 1)] : undefined;

export { rand, randFloat, noteToFreq, sample, randLog };
