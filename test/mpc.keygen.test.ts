import { MPC } from '../src/index.node'
import readWasmFile, { filterMessage } from './readWasmFile'

describe('MPC Key Gen test', function () {
  test('2/3 MPC Key Gen', async () => {
    const { wasmFile } = await readWasmFile()
    const mpc1 = await MPC.init(wasmFile)
    const mpc2 = await MPC.init(wasmFile)
    const mpc3 = await MPC.init(wasmFile)
    let pp1, pp2, pp3
    // pp1 = (await mpc1.mpcHelper.prepare()).prepared_context_params
    // pp2 = (await mpc2.mpcHelper.prepare()).prepared_context_params
    // pp3 = (await mpc3.mpcHelper.prepare()).prepared_context_params

    const keyGen1 = mpc1.KeyGen.getCoSigner()
    const keyGen2 = mpc2.KeyGen.getCoSigner()
    const keyGen3 = mpc3.KeyGen.getCoSigner()

    const p1 = await keyGen1.setLocalParty('A', '1')
    const p2 = await keyGen2.setLocalParty('B', '2')
    const p3 = await keyGen3.setLocalParty('C', '3')

    console.log('parties>>>', p1, p2, p3)

    let m1: any = await keyGen1.createContext([p3, p2], pp1)
    let m2: any = await keyGen2.createContext([p1, p3], pp2)
    let m3: any = await keyGen3.createContext([p1, p2], pp3)

    let round = 0
    while (!(keyGen1.isComplete && keyGen2.isComplete && keyGen3.isComplete)) {
      const res1 = await keyGen1.runRound(
        filterMessage(p1.party_id, ...m2, ...m3),
      )
      const res2 = await keyGen2.runRound(
        filterMessage(p2.party_id, ...m1, ...m3),
      )
      const res3 = await keyGen3.runRound(
        filterMessage(p3.party_id, ...m1, ...m2),
      )

      round++
      m1 = res1
      m2 = res2
      m3 = res3
    }

    expect(keyGen1.getSignKey()).not.toBeUndefined()
    expect(keyGen2.getSignKey()).not.toBeUndefined()
    expect(keyGen3.getSignKey()).not.toBeUndefined()
    expect(keyGen1.getPubKey()).toEqual(keyGen2.getPubKey())
    expect(keyGen1.getPubKey()).toEqual(keyGen3.getPubKey())

    const mnemo1 = await mpc1.mpcHelper.extractMnemonicFromSignKey(
      keyGen1.getSignKey(),
    )
    const mnemo2 = await mpc1.mpcHelper.extractMnemonicFromSignKey(
      keyGen2.getSignKey(),
    )
    const mnemo3 = await mpc1.mpcHelper.extractMnemonicFromSignKey(
      keyGen3.getSignKey(),
    )

    const pub = keyGen1.getPubKey()
    console.log('pub >>>', pub)

    console.log('mnemonics 1 >>>', mnemo1)
    console.log('mnemonics 2 >>>', mnemo2)
    console.log('mnemonics 3 >>>', mnemo3)
  })
})
