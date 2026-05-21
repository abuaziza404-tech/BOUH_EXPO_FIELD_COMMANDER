import { AES } from "@stablelib/aes";
import { CBC } from "@stablelib/cbc";
import { pbkdf2 } from "@stablelib/pbkdf2";
import { SHA256 } from "@stablelib/sha256";
import { randomBytes } from "@stablelib/random";
import { encode as b64encode } from "base-64";

function pkcs7Pad(input: Uint8Array, blockSize = 16): Uint8Array {
  const pad = blockSize - (input.length % blockSize);
  const out = new Uint8Array(input.length + pad);
  out.set(input);
  out.fill(pad, input.length);
  return out;
}

export function deriveAes256Key(password: string, salt: Uint8Array, iterations = 150000): Uint8Array {
  return pbkdf2(SHA256, new TextEncoder().encode(password), salt, iterations, 32);
}

export function encryptJsonAes256(payload: unknown, password: string) {
  const salt = randomBytes(16);
  const iv = randomBytes(16);
  const key = deriveAes256Key(password, salt);
  const aes = new AES(key);
  const cbc = new CBC(aes, iv);
  const clear = pkcs7Pad(new TextEncoder().encode(JSON.stringify(payload)));
  const cipher = cbc.encrypt(clear);
  return {
    alg: "AES-256-CBC-PBKDF2-SHA256",
    iterations: 150000,
    salt: b64encode(String.fromCharCode(...salt)),
    iv: b64encode(String.fromCharCode(...iv)),
    data: b64encode(String.fromCharCode(...cipher))
  };
}
