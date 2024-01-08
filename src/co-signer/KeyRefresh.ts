import {
  ComputeMessage,
  GenerateMinimalKeyParams,
  GeneratePubAndZkpResult,
  KeyRefreshContextParams,
  KeyRefreshRoundParams,
  Party,
  PrepareParams,
} from '../mpc-assembly/mpc.types'
import { AbstractCoSigner } from './AbstractCoSigner'

export class KeyRefresh extends AbstractCoSigner {
  private mnemo: string

  private localParty: Party

  private remoteParties: Party[]

  private prepareParams: PrepareParams | null = null

  private minimalKey: string

  private X: string

  private signKey: string
  private pub: string

  getSignKey() {
    return this.signKey
  }

  getPub() {
    return this.pub
  }

  setLocalParty(partyId: string, index: string) {
    this.localParty = {
      index,
      party_id: partyId,
    }
    return this.localParty
  }

  async prepareKeyGenParams() {
    const result = await this.mpcAssemblyBridge.createContextGeneralParams()
    this.prepareParams = result.prepared_data
  }

  async generatePubAndZkp(mnemo: string): Promise<GeneratePubAndZkpResult> {
    const result = await this.mpcAssemblyBridge.generatePubAndZkp(mnemo)
    if (result.err) {
      throw new Error(
        `Generate pub and zkp failed, code: ${result.err.err_code}, message: ${result.err.err_msg}`,
      )
    }
    this.mnemo = mnemo
    this.X = result.X
    return result
  }

  async generateMinimalKey(
    localParty: Party,
    remoteParties: GenerateMinimalKeyParams['remote_parties'],
    remotePubs: { partyId: string; pub: string }[],
  ) {
    if (!this.mnemo) {
      throw new Error(`Mnemonic lost! You must generate pub and zkp first`)
    }

    if (!this.localParty) {
      this.localParty = localParty
    }

    remotePubs.forEach((rp) => {
      this.addRemoteCpk(rp.partyId, rp.pub)
    })

    this.remoteParties = remoteParties.map((rp) => ({
      party_id: rp.party_id,
      index: rp.index,
    }))

    const params: GenerateMinimalKeyParams = {
      curve_type: 1,
      n_parties: 3,
      threshold: 2,
      party_id: this.localParty.party_id,
      index: this.localParty.index,
      X: this.X,
      mnemo: this.mnemo,
      remote_parties: remoteParties,
    }

    const res = await this.mpcAssemblyBridge.generateMinimalKey(params)
    if (res.err) {
      throw new Error(
        `Generate minimal key occur an error:
        code: ${res.err.err_code}, message: ${res.err.err_msg} `,
      )
    }

    this.minimalKey = res.minimal_sign_key
  }

  async createContext(
    prepareParams?: PrepareParams,
  ): Promise<ComputeMessage[]> {
    if (!this.minimalKey) {
      throw new Error(`Minimal key lost! You must generate minimal key first`)
    }

    if (!this.prepareParams && !prepareParams) {
      await this.prepareKeyGenParams()
    }

    this.checkCommunicationKey()

    const params: KeyRefreshContextParams = {
      n_parties: 3,
      minimal_sign_key: this.minimalKey,
      prepared_data: this.prepareParams,
      update_key_shards: false,
    }

    const contextResult = await this.mpcAssemblyBridge.keyRefreshContext(params)
    if (contextResult.err) {
      throw new Error(
        `Create key refresh context occur an error:
        code: ${contextResult.err.err_code}, message: ${contextResult.err.err_msg} `,
      )
    }

    this.contextId = contextResult.context
    this.lastRoundIndex = 0
    return await this.encryptMPCMessage(contextResult.out_message_list)
  }

  async runRound(
    remoteMessageList: ComputeMessage[],
  ): Promise<ComputeMessage[]> {
    remoteMessageList = await this.decryptMPCMessage(remoteMessageList)

    const params: KeyRefreshRoundParams = {
      context: this.contextId,
      last_round_index: this.lastRoundIndex,
      in_message_list: remoteMessageList,
    }
    const roundResult = await this.mpcAssemblyBridge.keyRefreshRound(params)
    if (roundResult.err) {
      await this.destroy()
      throw new Error(
        `key refresh round: [${this.lastRoundIndex + 1}] occur an error:
        code: ${roundResult.err.err_code}, message: ${
          roundResult.err.err_msg
        } `,
      )
    }

    this.lastRoundIndex++

    const isComplete = !!roundResult.sign_key
    if (isComplete) {
      this.pub = roundResult.pub
      this.signKey = roundResult.sign_key
      this.isComplete = true
      await this.destroy()
    }
    return (await this.encryptMPCMessage(roundResult.out_message_list)) || []
  }

  async destroy() {
    await this.mpcAssemblyBridge.destroyKeyRefreshContextById(this.contextId)
    this.contextId = ''
  }
}
