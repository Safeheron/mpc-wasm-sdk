import {
  ComputeMessage,
  KeyRecoveryParams,
  KeyRecoveryRoundParams,
} from '../mpc-assembly/mpc.types'
import { AbstractCoSigner } from './AbstractCoSigner'

export class KeyRecovery extends AbstractCoSigner {
  private _pubKeyOfThreeParty = ''
  private _partySecretKey = ''
  private _pub = ''

  get pubKeyOfThreeParty() {
    return this._pubKeyOfThreeParty
  }

  get partySecretKey() {
    return this._partySecretKey
  }

  get pub() {
    return this._pub
  }

  async createContext(
    localMnemonic: string,
    localPartyIndex: string,
    remotePartyIndex: string,
    lostPartyIndex: string,
  ) {
    if (!localPartyIndex || !remotePartyIndex || !lostPartyIndex) {
      throw new Error('Party Index of all three parties cannot be empty.')
    }

    if (
      localPartyIndex === remotePartyIndex ||
      localPartyIndex === lostPartyIndex ||
      remotePartyIndex === lostPartyIndex
    ) {
      throw new Error('The partyIndex of the three parties cannot be equal.')
    }

    const params: KeyRecoveryParams = {
      curve_type: 1,
      mnemo: localMnemonic,
      i: localPartyIndex,
      j: remotePartyIndex,
      k: lostPartyIndex,
      local_party_id: localPartyIndex,
      remote_party_id: remotePartyIndex,
    }

    const res = await this.mpcAssemblyBridge.createContextForKeyRecovery(params)

    if (res.err) {
      throw new Error(
        `Create key recovery context occur an error:
        code: ${res.err.err_code}, message: ${res.err.err_msg} `,
      )
    }

    this.contextId = res.context
    this.lastRoundIndex = 0
    return res.out_message_list
  }

  async runRound(remoteMessageList: ComputeMessage[]) {
    const params: KeyRecoveryRoundParams = {
      context: this.contextId,
      last_round_index: this.lastRoundIndex,
      in_message_list: remoteMessageList,
    }
    const res = await this.mpcAssemblyBridge.runRoundForKeyRecovery(params)
    if (res.err) {
      await this.destroy()
      throw new Error(
        `Key recovery round: [${
          this.lastRoundIndex + 1
        }] occur an error: code: ${res.err.err_code}, message: ${
          res.err.err_msg
        }`,
      )
    }

    this.lastRoundIndex = res.current_round_index
    const isComplete = !!res.X_k && !!res.s
    if (isComplete) {
      this.isComplete = true
      this._pubKeyOfThreeParty = res.X_k
      this._partySecretKey = res.s
      this._pub = res.pub
      await this.destroy()
    }

    return res.out_message_list || []
  }

  private async destroy() {
    await this.mpcAssemblyBridge.destroyKeyRecoveryContextById(this.contextId)
    this.contextId = 0
  }
}
