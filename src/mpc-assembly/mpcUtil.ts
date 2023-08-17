export function fromHexString(hexString) {
  return new Uint8Array(
    hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)),
  )
}

export function toHexString(bytes): string {
  return bytes.reduce(
    (str, byte) => str + byte.toString(16).padStart(2, '0'),
    '',
  )
}

export function uint8ArrayToString(bytes, len) {
  let dataString = ''
  for (let i = 0; i < len; i++) {
    dataString += String.fromCharCode(bytes[i])
  }

  return dataString
}

export function stringToUint8Array(str: string) {
  const arr: number[] = []
  for (let i = 0, j = str.length; i < j; ++i) {
    arr.push(str.charCodeAt(i))
  }

  return new Uint8Array(arr)
}

export function int32ToUint8Array(int32) {
  const bytes = new Uint8Array(4)
  bytes[0] = int32 & 0x000000ff
  bytes[1] = (int32 >> 8) & 0x000000ff
  bytes[2] = (int32 >> 16) & 0x000000ff
  bytes[3] = (int32 >> 24) & 0x000000ff
  return bytes
}

export function uint8ArrayToInt32(bytes) {
  let ret = bytes[0] & 0xff
  ret |= (bytes[1] << 8) & 0xff00
  ret |= (bytes[2] << 16) & 0xff0000
  ret |= (bytes[3] << 24) & 0xff000000
  return ret
}

export function genRandomBytesHex(bytes: number) {
  const buffer = new Uint8Array(bytes)
  crypto.getRandomValues(buffer)
  return buffer.reduce(
    (prev, curr) => prev + curr.toString(16).padStart(2, '0'),
    '',
  )
}
