import { Bee, BeeDebug, PostageBatch, Utils } from '@ethersphere/bee-js'
import { generateRandomByteArray, sleep, waitUntilStampUsable } from './utils'
import { logger } from './logger'
import {
  beeApiUrl,
  beeDebugApiUrl,
  postageStampsAmount,
  postageStampsDepth,
  postageStampsUsablePollingFrequency,
  postageStampsUsableTimeout,
} from './config'

const bee = new Bee(beeApiUrl)
const beeDebug = new BeeDebug(beeDebugApiUrl)

/**
 * @param {BeePair} beePair
 */
async function uploadRandomBytes(bee: Bee, postageBatch: PostageBatch, bytes: number, seed = 500) {
  const randomBytes = generateRandomByteArray(bytes, seed)
  const { reference } = await bee.uploadData(postageBatch.batchID, randomBytes)
  logger.info(`uploaded ${bytes} bytes to ${reference}`)
}

async function main() {
  const usageLevels: Record<number, number> = {}
  logger.info('buying postage stamp')
  const batchID = await beeDebug.createPostageBatch(postageStampsAmount, postageStampsDepth)
  logger.info('waiting for stamp to be usable')
  await waitUntilStampUsable(batchID, beeDebug, {
    pollingFrequency: postageStampsUsablePollingFrequency,
    timeout: postageStampsUsableTimeout,
  })
  logger.info('postage stamp is usable, starting data upload')
  let uploadedData = 0
  const bytes = 4_096 + 1
  try {
    // eslint-disable-next-line
    while (true) {
      await sleep(1000)
      const postageBatch = await beeDebug.getPostageBatch(batchID)
      const usage = Utils.getStampUsage(postageBatch)

      if (usageLevels[usage] === undefined) usageLevels[usage] = uploadedData
      await uploadRandomBytes(bee, postageBatch, bytes, Date.now())
      uploadedData += bytes
      logger.info(uploadedData)
    }
  } catch (e) {
    logger.info(e)
    logger.info(uploadedData)
    console.log(JSON.stringify(usageLevels, null, 2)) // eslint-disable-line
  }
}
main()
