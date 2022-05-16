import type { BatchId, BeeDebug } from '@ethersphere/bee-js'

/**
 * Lehmer random number generator with seed (minstd_rand in C++11)
 * !!! Very fast but not well distributed pseudo-random function !!!
 *
 * @param seed Seed for the pseudo-random generator
 */
function lrng(seed: number) {
  return () => ((2 ** 31 - 1) & (seed = Math.imul(48271, seed))) / 2 ** 31
}

/**
 * Utility function for generating random Buffer
 * !!! IT IS NOT CRYPTO SAFE !!!
 * For that use `crypto.randomBytes()`
 *
 * @param length Number of bytes to generate
 * @param seed Seed for the pseudo-random generator
 */
export function generateRandomByteArray(length: number, seed = 500) {
  const rand = lrng(seed)
  const buf = new Uint8Array(length)

  for (let i = 0; i < length; ++i) {
    buf[i] = (rand() * 0xff) << 0
  }

  return buf
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

interface Options {
  pollingFrequency: number
  timeout: number
}

export async function waitUntilStampUsable(batchId: BatchId, beeDebug: BeeDebug, options: Options) {
  const timeout = options.timeout
  const pollingFrequency = options.pollingFrequency

  for (let i = 0; i < timeout; i += pollingFrequency) {
    const stamp = await beeDebug.getPostageBatch(batchId)

    if (stamp.usable) return stamp
    await sleep(pollingFrequency)
  }

  throw new Error('Wait until stamp usable timeout has been reached')
}
