import axios from 'axios'
import { config } from "../constant/config";

const { backend_url } = config

const getCollectionData = ({ queryKey }) => {
  const [ _, collectionAddress ] = queryKey
  return axios.get(`${backend_url}/${collectionAddress}`)
    .then((res) => {
      if (res && res.data) {
        const { result, data } = res.data
        if (result) return data
      }
      return null
    })
    .catch(() => null)
}

const getItemsData = (items) => {
  return axios.post(`${backend_url}/getItems`, { items })
    .then((res) => {
      if (res && res.data) {
        const { result, data } = res.data
        if (result) return data
      }
      return null
    })
    .catch(() => null)
}

const getItemData = (collectionAddress, tokenId) => {
  return axios.get(`${backend_url}/${collectionAddress}/${tokenId}`)
    .then((res) => {
      if (res && res.data) {
        const { result, data } = res.data
        if (result) return data
      }
      return null
    })
    .catch(() => null)
}

export {
  getCollectionData,
  getItemsData,
  getItemData
}
