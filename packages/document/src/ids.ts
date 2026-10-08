import { customAlphabet } from 'nanoid'

const createId = customAlphabet(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  8,
)

export function createBlockId(): string {
  return createId()
}
