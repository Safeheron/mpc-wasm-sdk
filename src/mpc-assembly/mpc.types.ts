export type C_Methods =
  | '_kg_create_context_compute_round0'
  | '_kg_compute_round1_6'
  | '_kg_destroy_context'
  | '_kr_create_context_compute_round0'
  | '_kr_compute_round1_3'
  | '_kr_destroy_context'
  | '_mkr_create_context_compute_round0'
  | '_mkr_compute_round1_3'
  | '_mkr_destroy_context'
  | '_sign_create_context_compute_round0'
  | '_sign_compute_round1_4'
  | '_sign_destroy_context'
  | '_aggregate_partial_shard'
  | '_extract_mnemo_from_sign_key'
  | '_extract_rid_from_sign_key'
  | '_prepare_data'
  | '_SetSeed'
  | '_generate_key_pair'
  | '_AuthEnc_encrypt'
  | '_AuthEnc_decrypt'
  | '_ecdsa_sign'
  | '_ecdsa_verify'
  | '_generate_pub_with_zkp'
  | '_generate_minimal_key'

// 1: secp256k1, 2:p256
export type Curve_Type = 1 | 2 | 32

export type Call_type<M extends C_Methods, P, R> = {
  method: M
  params: P
  result: R
}

export interface Party {
  party_id: string
  /**
   * A random hex string, limit by 32 bytes
   */
  index: string
}

export type PartyWithPub = Party & { pub: string }

interface MPCError {
  err?: {
    err_code: number
    err_msg: string
  }
}

export interface ComputeMessage {
  p2p_message: string
  broadcast_message: string
  source: string
  destination: string
}

export interface ComputeCommonParams {
  context: string
  last_round_index: number
  in_message_list: ComputeMessage[]
}

export interface ComputeCommonResult {
  context: string
  current_round_index: number
  out_message_list: ComputeMessage[]
}

// ----------- generate key-pair --------------
export type GenerateKeyPairParams = Curve_Type

export interface GenerateKeyPairResult extends MPCError {
  priv: string
  pub: string
}
export type Call_GenerateKeyPair = Call_type<
  '_generate_key_pair',
  GenerateKeyPairParams,
  GenerateKeyPairResult
>

// ----------- encrypted --------------
export interface AuthEncryptedParams {
  local_priv: string
  remote_pub: string
  plain: string
}

export interface AuthEncryptedResult extends MPCError {
  cypher: string // encoding in hex
}

export type Call_AuthEncrypted = Call_type<
  '_AuthEnc_encrypt',
  AuthEncryptedParams,
  AuthEncryptedResult
>

// ----------- decrypted --------------
export interface AuthDecryptedParams {
  local_priv: string
  remote_pub: string
  cypher: string // hex string
}

export interface AuthDecryptedResult extends MPCError {
  plain: string
}

export type Call_AuthDecrypted = Call_type<
  '_AuthEnc_decrypt',
  AuthDecryptedParams,
  AuthDecryptedResult
>

// ----------- ecdsa sign --------------
export interface EcdsaSignParams {
  priv: string
  digest: string
}

export interface EcdsaSignResult extends MPCError {
  sig: string
}

export type Call_EcdsaSign = Call_type<
  '_ecdsa_sign',
  EcdsaSignParams,
  EcdsaSignResult
>

// ----------- ecdsa verify --------------
export interface EcdsaVerifyParams {
  pub: string
  digest: string
  sig: string
}

export type EcdsaVerifyResult = MPCError

export type Call_EcdsaVerify = Call_type<
  '_ecdsa_verify',
  EcdsaVerifyParams,
  boolean
>

// ----------- set random seed --------------
export type Call_SetRandomSeed = Call_type<'_SetSeed', string, boolean>

// ----------- extract mnemonic from sign key --------------
export type ExtractMnemonicParams = {
  sign_key: string
}
export interface ExtractMnemonicResult extends MPCError {
  mnemo?: string
}

export type Call_ExtractMnemonicFromSignKey = Call_type<
  '_extract_mnemo_from_sign_key',
  ExtractMnemonicParams,
  ExtractMnemonicResult
>

// ------------ extract rid from sign key  ----------------------
export type ExtractRidParams = {
  sign_key: string
}

export interface ExtractRicResult extends MPCError {
  rid: string
}

export type Call_ExtractRidFromSignKey = Call_type<
  '_extract_rid_from_sign_key',
  ExtractRidParams,
  ExtractRicResult
>

// ----------- prepare context --------------
export interface PrepareParams {
  N: string
  s: string
  t: string
  p: string
  q: string
  alpha: string
  beta: string
  two_dln_proof: string
  pail_blum_modules_proof: string
}

export type PrepareContextParams = undefined

export interface PrepareContextResult extends MPCError {
  prepared_data: PrepareParams
}

export type Call_PrepareContextParams = Call_type<
  '_prepare_data',
  PrepareContextParams,
  PrepareContextResult
>

// ----------- Key Gen Context --------------
export type KeyGenContextParams = {
  n_parties: number
  threshold: number
  curve_type: number
  remote_parties: Party[]
  prepared_data: PrepareParams
} & Party

export type KeyGenContextResult = ComputeCommonResult & MPCError

export type Call_KeyGenContextAndRound0 = Call_type<
  '_kg_create_context_compute_round0',
  KeyGenContextParams,
  KeyGenContextResult
>

// ----------- Key Gen Round --------------
export type KeyGenRoundParams = ComputeCommonParams

export type KeyGenRoundResult = MPCError &
  ComputeCommonResult & {
    pub?: string
    sign_key?: string
  }

export type Call_KeyGenRound = Call_type<
  '_kg_compute_round1_6',
  KeyGenRoundParams,
  KeyGenRoundResult
>

// ----------- Signer Context and round 0 --------------

export interface SignContextParams {
  participants: string[]
  /**
   * Hex string of serialized transaction object
   */
  digest: string
  sign_key: string
}

export type SignContextResult = MPCError & ComputeCommonResult

export type Call_SignContextAndRound0 = Call_type<
  '_sign_create_context_compute_round0',
  SignContextParams,
  SignContextResult
>

// ----------- Signer round 1-4 --------------

export type SignRoundParams = ComputeCommonParams

export type SignRoundResult = MPCError &
  ComputeCommonResult & {
    signature?: {
      r: string
      s: string
      v: number
    }
    signedTxHash?: string
  }

export type Call_SignRound = Call_type<
  '_sign_compute_round1_4',
  SignRoundParams,
  SignRoundResult
>

// ----------- key recovery context --------------

export interface KeyRecoveryParams {
  curve_type: Curve_Type
  mnemo: string // local mnemonic
  i: string // local party index
  j: string // remote party index (not lost side)
  k: string // remote party index (lost side)
  local_party_id: string
  remote_party_id: string
}

export type KeyRecoveryResult = MPCError & ComputeCommonResult

export type Call_KeyRecovery = Call_type<
  '_kr_create_context_compute_round0',
  KeyRecoveryParams,
  KeyRecoveryResult
>

// ----------- key recovery round --------------
export type KeyRecoveryRoundParams = ComputeCommonParams

export type KeyRecoveryRoundResult = MPCError &
  ComputeCommonResult & {
    x_ki: string // partial secret key shard of the third party
    X_k: string // public key shard of the third party
    pub: string // full public key
  }

export type Call_KeyRecoveryRound = Call_type<
  '_kr_compute_round1_3',
  KeyRecoveryRoundParams,
  KeyRecoveryRoundResult
>

// ----------- key refresh context --------------
export interface KeyRefreshContextParams {
  n_parties: number
  minimal_sign_key: string
  prepared_data: PrepareParams | null
  // true: update key shards, false: don't update key shards
  update_key_shards: boolean
}

export type KeyRefreshContextResult = MPCError & ComputeCommonResult

export type Call_KeyRefreshContext = Call_type<
  '_mkr_create_context_compute_round0',
  KeyRefreshContextParams,
  KeyRefreshContextResult
>

// ----------- key refresh round --------------
export type KeyRefreshRoundParams = ComputeCommonParams

export type KeyRefreshRoundResult = MPCError &
  ComputeCommonResult & {
    pub: string
    sign_key: string
  }
export type Call_KeyRefreshRound = Call_type<
  '_mkr_compute_round1_3',
  KeyRefreshRoundParams,
  KeyRefreshRoundResult
>

// ----------- destroy key refresh context --------------
export type Call_DestroySingleContextForKeyRefresh = Call_type<
  '_mkr_destroy_context',
  { contextId: string },
  null
>

// ----------- Generate x_pub and zkp --------------
export interface GeneratePubAndZkpParams {
  curve_type: Curve_Type
  mnemo: string
}

export interface GeneratePubAndZkpResult extends MPCError {
  X: string
  dlog_zkp: string
}

export type Call_GeneratePubAndZkp = Call_type<
  '_generate_pub_with_zkp',
  GeneratePubAndZkpParams,
  GeneratePubAndZkpResult
>

// ----------- Generate minimal key --------------
export interface GenerateMinimalKeyParams {
  curve_type: Curve_Type
  n_parties: number
  threshold: number
  party_id: string
  index: string
  mnemo: string
  X: string
  remote_parties: (Party & { X: string; dlog_zkp: string })[]
}

export interface GenerateMinimalKeyResult extends MPCError {
  minimal_sign_key: string
}

export type Call_GenerateMinimalKey = Call_type<
  '_generate_minimal_key',
  GenerateMinimalKeyParams,
  GenerateMinimalKeyResult
>

// ----------- aggregate --------------

export interface AggregateKeyShardParams {
  partial_shards: string[]
  curve_type: number
  X: string
}

export interface AggregateKeyShardResult extends MPCError {
  mnemo: string // mnemonic of the third party (lost side)
}

export type Call_AggregateKeyShard = Call_type<
  '_aggregate_partial_shard',
  AggregateKeyShardParams,
  AggregateKeyShardResult
>
