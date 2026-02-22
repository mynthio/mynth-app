import { randomBytes } from "node:crypto";

const UUID_V7_RANDOM_MASK = (1n << 74n) - 1n;
const UUID_V7_RAND_B_MASK = (1n << 62n) - 1n;
const UUID_V7_MAX_TIMESTAMP_MS = 0xffffffffffff;

let lastTimestampMs = -1;
let lastRandom74 = 0n;

function random74Bits(): bigint {
  const bytes = randomBytes(10);
  let value = 0n;

  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }

  return value & UUID_V7_RANDOM_MASK;
}

function waitForNextMillisecond(previousTimestampMs: number): number {
  let now = Date.now();

  while (now <= previousTimestampMs) {
    now = Date.now();
  }

  return now;
}

function formatUuidBytes(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20,
  )}-${hex.slice(20)}`;
}

function encodeUuidV7(timestampMs: number, random74: bigint): string {
  if (!Number.isInteger(timestampMs) || timestampMs < 0 || timestampMs > UUID_V7_MAX_TIMESTAMP_MS) {
    throw new Error(`UUIDv7 timestamp is out of range: ${timestampMs}`);
  }

  const bytes = new Uint8Array(16);

  let timestamp = BigInt(timestampMs);
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = Number(timestamp & 0xffn);
    timestamp >>= 8n;
  }

  const randA = Number((random74 >> 62n) & 0xfffn);
  const randB = random74 & UUID_V7_RAND_B_MASK;

  bytes[6] = 0x70 | ((randA >> 8) & 0x0f);
  bytes[7] = randA & 0xff;
  bytes[8] = 0x80 | Number((randB >> 56n) & 0x3fn);

  let remainingRandB = randB;
  for (let index = 15; index >= 9; index -= 1) {
    bytes[index] = Number(remainingRandB & 0xffn);
    remainingRandB >>= 8n;
  }

  return formatUuidBytes(bytes);
}

export function createUuidV7(): string {
  let timestampMs = Date.now();

  if (timestampMs < lastTimestampMs) {
    timestampMs = lastTimestampMs;
  }

  if (timestampMs === lastTimestampMs) {
    if (lastRandom74 === UUID_V7_RANDOM_MASK) {
      timestampMs = waitForNextMillisecond(lastTimestampMs);
      lastRandom74 = random74Bits();
    } else {
      lastRandom74 += 1n;
    }
  } else {
    lastRandom74 = random74Bits();
  }

  lastTimestampMs = timestampMs;
  return encodeUuidV7(timestampMs, lastRandom74);
}
