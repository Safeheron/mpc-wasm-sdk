import { MPC } from '../src/index.node'
import readWasmFile from './readWasmFile'

describe('MPC Key Recovery test', function () {
  test('2/3 MPC Key Recovery', async () => {
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

    const { wasmFile } = await readWasmFile()

    console.time('KeyRecovery')

    const mpc1 = await MPC.init(wasmFile)
    const mpc2 = await MPC.init(wasmFile)

    const recovery1 = mpc1.KeyRecovery.getCoSigner()
    const recovery2 = mpc2.KeyRecovery.getCoSigner()

    let [m1, m2] = await Promise.all([
      recovery1.createContext(mnemo1, party1.index, party2.index, party3.index),
      recovery2.createContext(mnemo2, party2.index, party1.index, party3.index),
    ])

    while (!recovery1.isComplete && !recovery2.isComplete) {
      ;[m1, m2] = await Promise.all([
        recovery1.runRound(m2),
        recovery2.runRound(m1),
      ])
    }

    const X1 = recovery1.pubKeyOfThreeParty
    const X2 = recovery2.pubKeyOfThreeParty

    expect(X1).toEqual(X2)

    const pub1 = recovery1.pub
    const pub2 = recovery2.pub

    expect(pub1).toEqual(pub2)

    const s1 = recovery1.partySecretKey
    const s2 = recovery2.partySecretKey

    console.log('X>>>', X1)
    console.log('pub>>>', pub1)
    console.log('party secret>>>', s1, s2)

    const thirdMnemo = await mpc1.mpcHelper.aggregateKeyShard([s1, s2], X1)

    console.log('thirdMnemo', thirdMnemo.mnemo)

    expect(thirdMnemo.mnemo).toEqual(mnemo3)
    console.timeEnd('KeyRecovery')
  })
})
