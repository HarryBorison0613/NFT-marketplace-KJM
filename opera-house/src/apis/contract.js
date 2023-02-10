import axios from 'axios'
import { config } from '../constant/config'

const getDefaultNFTs = () => {
  return axios.get(`${config.backendUrl}api/collections/default/nfts`)
}

const getCollectionNFTs = (address, startId, endId) => {
  return axios.get(`${config.backendUrl}api/collections/${address}/nfts?startId=${startId}&endId=${endId}`)
}

const getCollectionInfo = (address) => {
  return axios.get(`${config.backendUrl}api/collections/${address}/info`)
}

const getCollectionNFTsCount = (address) => {
  return axios.get(`${config.backendUrl}api/collections/${address}/nfts/count`)
}

export {
  getDefaultNFTs,
  getCollectionNFTs,
  getCollectionInfo,
  getCollectionNFTsCount
}
