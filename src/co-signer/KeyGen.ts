import {
  ComputeMessage,
  KeyGenContextParams,
  KeyGenRoundParams,
  Party,
  PartyWithPub,
  PrepareParams,
} from '../mpc-assembly/mpc.types'
import { genRandomBytesHex } from '../mpc-assembly/mpcUtil'
import { AbstractCoSigner } from './AbstractCoSigner'

export class KeyGen extends AbstractCoSigner {
  private localParty: Party

  private keyGenPrepareParams?: PrepareParams
  private signKey?: string
  private pubKey?: string

  getSignKey() {
    return this.signKey
  }

  getPubKey() {
    return this.pubKey
  }

  async prepareKeyGenParams() {
    const result = await this.mpcAssemblyBridge.createContextGeneralParams()
    this.keyGenPrepareParams = result.prepared_data
  }

  async createParty(partyId: string): Promise<Party> {
    const party = {
      index: genRandomBytesHex(32),
      party_id: partyId,
    }
    this.localParty = party
    return party
  }

  setLocalParty(partyId: string, index: string) {
    this.localParty = {
      index,
      party_id: partyId,
    }
    return this.localParty
  }

  async createContext(
    remoteParties: PartyWithPub[],
    prepareParams?: PrepareParams,
  ): Promise<ComputeMessage[]> {
    this.checkCommunicationKey()

    if (!this.keyGenPrepareParams && !prepareParams) {
      await this.prepareKeyGenParams()
    }

    if (!this.localParty) {
      throw new Error('You must create party first before create context.')
    }

    // Add remote communication pubkey
    remoteParties.forEach((rp) => {
      this.addRemoteCpk(rp.party_id, rp.pub)
    })

    const baseParams = {
      n_parties: 3,
      threshold: 2,
      curve_type: 1,
    }
    const params: KeyGenContextParams = {
      ...baseParams,
      remote_parties: remoteParties,
      prepared_data: prepareParams || this.keyGenPrepareParams,
      ...this.localParty,
    }
    const contextResult =
      await this.mpcAssemblyBridge.keyGenContextAndComputeRound(params)
    if (contextResult.err) {
      throw new Error(
        `Create key context occur an error:
        code: ${contextResult.err.err_code}, message: ${contextResult.err.err_msg} `,
      )
    }

    this.contextId = contextResult.context
    this.lastRoundIndex = 0
    return this.encryptMPCMessage(contextResult.out_message_list)
  }

  async runRound(
    remoteMessageList: ComputeMessage[],
  ): Promise<ComputeMessage[]> {
    remoteMessageList = await this.decryptMPCMessage(remoteMessageList)

    const params: KeyGenRoundParams = {
      context: this.contextId,
      last_round_index: this.lastRoundIndex,
      in_message_list: remoteMessageList,
    }
    const roundResult = await this.mpcAssemblyBridge.keyGenRound(params)
    if (roundResult.err) {
      await this.destroy()
      throw new Error(
        `key gen round: [${this.lastRoundIndex + 1}] occur an error:
        code: ${roundResult.err.err_code}, message: ${
          roundResult.err.err_msg
        } `,
      )
    }
    this.lastRoundIndex++

    const isComplete = !!roundResult.sign_key
    if (isComplete) {
      this.isComplete = true
      this.signKey = roundResult.sign_key
      this.pubKey = roundResult.pub
      await this.destroy()
    }
    return (await this.encryptMPCMessage(roundResult.out_message_list)) || []
  }

  private async destroy() {
    await this.mpcAssemblyBridge.destroyKeyGenContextById(this.contextId)
    this.contextId = ''
    this.localParty = undefined
    this.lastRoundIndex = 0
  }
}
