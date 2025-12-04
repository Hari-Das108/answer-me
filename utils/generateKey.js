import { generateApiKey } from "generate-api-key";

export function createApiKey() {
  return generateApiKey({
    method: "string",
    length: 16,
    prefix: "rg",
    pool: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  }).replace(".", "-");
}
