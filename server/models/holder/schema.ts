import { Schema, model } from 'mongoose'

export const HOLDER_MODEL_NAME = 'Holder'
export interface IHolder {
  address: string;
  name: string;
}
const holderSchema = new Schema<IHolder>({
  address: String,
  name: { type: String, unique: true },
})

export const Holder = model<IHolder>(
  HOLDER_MODEL_NAME,
  holderSchema,
  HOLDER_MODEL_NAME
)