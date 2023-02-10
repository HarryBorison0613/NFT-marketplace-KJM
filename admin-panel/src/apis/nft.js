import axios from 'axios'
import config from '../config'

const getCollectionCount = (collectionAddress) => {
  return axios.get(`${config.backend_url}/${collectionAddress}/count`)
    .then((res) => {
      if (res && res.data) {
        const { result, data } = res.data
        if (result) return data
      }
      return null
    })
    .catch(() => null)
}

const saveCollectionData = (collectionAddress, startId, endId, collectionName = '', ipfsUri = null,  replacement = false, replacementPrefix = null, replacementSubfix = '') => {
  return axios.post(`${config.backend_url}/fetchFromBC`, {
    collectionAddress,
    startId,
    endId,
    collectionName,
    replacement,
    replacementPrefix,
    replacementSubfix,
    ipfsUri
  })
    .then((res) => {
      if (res && res.data) {
        const { result, data } = res.data
        if (result)
          return data
        else return null
      } else {
        return null
      }
    })
    .catch(() => null)
}

const deleteNFTData = (collectionAddress, startId, endId) => {
  return axios.post(`${config.backend_url}/remove`, {
    collectionAddress,
    startId,
    endId,
  })
    .then((res) => {
      if (res && res.data) {
        const { result } = res.data
        if (result)
          return true
        else return false
      } else {
        return false
      }
    })
    .catch(() => false)
}

const calculateRarity = (collectionAddress) => {
  return axios.post(`${config.backend_url}/calculateRarity`, {
    collectionAddress,
  })
    .then((res) => {
      if (res && res.data) {
        const { result, data } = res.data
        if (result)
          return data
        else return null
      } else {
        return null
      }
    })
    .catch(() => null)
}

export {
  getCollectionCount,
  saveCollectionData,
  calculateRarity,
  deleteNFTData
}
