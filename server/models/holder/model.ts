import { Holder, IHolder } from './schema'

function addHolders(addresses: IHolder['address'][], names: IHolder['name'][]) {
  return new Promise((resolve, reject) => {
    const newHolders: IHolder[] = []
    addresses.forEach((addr, idx) => {
      newHolders.push({
        address: addr,
        name: names[idx]
      })
    })
    Holder.insertMany(newHolders)
      .then((r) => resolve(r))
      .catch((err) => reject(err))
  })
}

function updateHolder(holder: IHolder) {
  return new Promise((resolve, reject) => {
    Holder.findOne({ name: holder.name }).then((found) => {
      if (found !== null) {
        reject('Holder name already exists.')
      } else {
        Holder.findOneAndUpdate({ address: holder.address }, holder)
          .then((r) => resolve(r))
          .catch((err) => reject(err))
      }
    })
  })
}

function getAllHolders() {
  return new Promise((resolve, reject) => {
    Holder.find()
      .then((holders) => resolve(holders))
      .catch((error) => reject(error))
  })
}

async function getNewHolders(addresses: IHolder['address'][]) {
  const oldHolders = await Holder.find({ address: { $in: addresses } })
    .select({ address: 1 })


  const newHoldersAddress: string[] = []
  const newHoldersName: string[] = []
  addresses.forEach((addr) => {
    if (oldHolders.findIndex((h) => h.address === addr) < 0) {
      newHoldersAddress.push(addr)
      newHoldersName.push('')
    }
  })
  return { addresses: newHoldersAddress, names: newHoldersName }
}

export default {
  getNewHolders,
  getAllHolders,
  updateHolder,
  addHolders
}
