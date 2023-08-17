import { MPC } from '../src/index.node'
import readWasmFile, { filterMessage } from './readWasmFile'

describe('MPC Key Refresh test', function () {
  test('2/3 MPC Key Refresh ', async () => {
    const party1 = {
      party_id: 'A',
      index: '1',
    }
    const party2 = {
      party_id: 'B',
      index: '2',
    }
    const party3 = {
      party_id: 'C',
      index: '3',
    }

    const mnemo1 =
      'velvet dust fan enforce okay pulp coyote buffalo left rely extend panic unveil dirt kidney frame loyal lock biology hole grain clip grape this'
    const mnemo2 =
      'sail bar inherit clinic labor enough bone potato caution swing film enhance hurdle inmate grab away reveal slab gadget thrive law imitate soap ankle'
    const mnemo3 =
      'mechanic they network around future trick absurd critic ski actor fortune vocal vague prepare exotic session unaware bar poem fiber north response cube common'

    const pubKey =
      '04e0be6aecd5cc5c6618fbbed6613c96c82578ab012cd3cddc8910c5ce7d32553256859e73e2f1063fd6402b985a393b1b69e4d06645a601621021c0f42bafecd9'

    const { wasmFile } = await readWasmFile()
    const mpc1 = await MPC.init(wasmFile)
    const mpc2 = await MPC.init(wasmFile)
    const mpc3 = await MPC.init(wasmFile)

    const keyRefresh1 = mpc1.KeyRefresh.getCoSigner()
    const keyRefresh2 = mpc2.KeyRefresh.getCoSigner()
    const keyRefresh3 = mpc3.KeyRefresh.getCoSigner()

    console.time('KeyRefresh')

    const [pubAndZkp1, pubAndZkp2, pubAndZkp3] = await Promise.all([
      keyRefresh1.generatePubAndZkp(mnemo1),
      keyRefresh2.generatePubAndZkp(mnemo2),
      keyRefresh3.generatePubAndZkp(mnemo3),
    ])
    console.log('pubAndZkp done')

    await Promise.all([
      keyRefresh1.generateMinimalKey(party1, [
        { ...party2, ...pubAndZkp2 },
        { ...party3, ...pubAndZkp3 },
      ]),
      keyRefresh2.generateMinimalKey(party2, [
        { ...party1, ...pubAndZkp1 },
        { ...party3, ...pubAndZkp3 },
      ]),
      keyRefresh3.generateMinimalKey(party3, [
        { ...party2, ...pubAndZkp2 },
        { ...party1, ...pubAndZkp1 },
      ]),
    ])

    console.log('MinimalKey done')
    await Promise.all([
      keyRefresh1.prepareKeyGenParams(),
      keyRefresh2.prepareKeyGenParams(),
      keyRefresh3.prepareKeyGenParams(),
    ])

    console.log('prepare done')

    let [m1, m2, m3] = await Promise.all([
      keyRefresh1.createContext(),
      keyRefresh2.createContext(),
      keyRefresh3.createContext(),
    ])
    console.log('createContext done')

    while (
      !(
        keyRefresh1.isComplete &&
        keyRefresh2.isComplete &&
        keyRefresh3.isComplete
      )
    ) {
      ;[m1, m2, m3] = await Promise.all([
        keyRefresh1.runRound(filterMessage(party1.party_id, ...m2, ...m3)),
        keyRefresh2.runRound(filterMessage(party2.party_id, ...m1, ...m3)),
        keyRefresh3.runRound(filterMessage(party3.party_id, ...m2, ...m1)),
      ])
    }

    console.timeEnd('KeyRefresh')

    const signKey1 = keyRefresh1.getSignKey()
    const signKey2 = keyRefresh2.getSignKey()
    const signKey3 = keyRefresh3.getSignKey()

    console.log('signKey1>>>', signKey1)
    console.log('signKey2>>>', signKey2)
    console.log('signKey3>>>', signKey3)

    const pub = keyRefresh1.getPub()
    console.log('pub>>>', pub)

    expect(pub).toEqual(pubKey)

    const extractMnemo1 = await mpc1.mpcHelper.extractMnemonicFromSignKey(
      signKey1,
    )
    const extractMnemo2 = await mpc1.mpcHelper.extractMnemonicFromSignKey(
      signKey2,
    )
    const extractMnemo3 = await mpc1.mpcHelper.extractMnemonicFromSignKey(
      signKey3,
    )

    expect(extractMnemo1.mnemo).toEqual(mnemo1)
    expect(extractMnemo2.mnemo).toEqual(mnemo2)
    expect(extractMnemo3.mnemo).toEqual(mnemo3)
  })
})
