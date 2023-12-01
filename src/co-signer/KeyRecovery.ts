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

  private lostPartyId = ''

  get pubKeyOfThreeParty() {
    return this._pubKeyOfThreeParty
  }

  /**
   * @deprecated
   */
  get partySecretKey() {
    return this._partySecretKey
  }

  get pub() {
    return this._pub
  }

  async createContext(contextParams: {
    localMnemonic: string
    localParty: {
      partyId: string
      index: string
    }
    remoteParty: {
      partyId: string
      index: string
      pub: string
    }
    lostParty: {
      partyId: string
      index: string
      pub: string
    }
  }) {
    const { localMnemonic, localParty, lostParty, remoteParty } = contextParams
    this.checkCommunicationKey()
    this.addRemoteCpk(remoteParty.partyId, remoteParty.pub)
    this.addRemoteCpk(lostParty.partyId, lostParty.pub)

    if (!localParty.index || !remoteParty.index || !lostParty.index) {
      throw new Error('Party Index of all three parties cannot be empty.')
    }

    if (
      localParty.index === remoteParty.index ||
      localParty.index === lostParty.index ||
      remoteParty.index === lostParty.index
    ) {
      throw new Error('The partyIndex of the three parties cannot be equal.')
    }

    this.lostPartyId = lostParty.partyId

    const params: KeyRecoveryParams = {
      curve_type: 1,
      mnemo: localMnemonic,
      i: localParty.index,
      j: remoteParty.index,
      k: lostParty.index,
      local_party_id: localParty.partyId,
      remote_party_id: remoteParty.partyId,
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
    return await this.encryptMPCMessage(res.out_message_list)
  }

  async runRound(remoteMessageList: ComputeMessage[]) {
    remoteMessageList = await this.decryptMPCMessage(remoteMessageList)

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
    const isComplete = !!res.X_k && !!res.x_ki
    if (isComplete) {
      this.isComplete = true
      this._pubKeyOfThreeParty = res.X_k
      this._partySecretKey = res.x_ki
      this._pub = res.pub
      await this.destroy()
    }

    return (await this.encryptMPCMessage(res.out_message_list)) || []
  }

  async getEncryptedPartySecretKey(): Promise<string> {
    const result = await this.mpcAssemblyBridge.encrypt(
      this.localCpkp.priv,
      this.getRemoteCpk(this.lostPartyId),
      this._partySecretKey,
    )
    return result.cypher
  }

  private async destroy() {
    await this.mpcAssemblyBridge.destroyKeyRecoveryContextById(this.contextId)
    this.contextId = ''
  }
}
