import axios from 'axios'
import { config } from '../constant/config'

const newSaleBotMessage = (data) => {
  const { id, title, description, price, assetURI: image, collectionAddress, attributes } = data
  const url = `https://operahouse.online/Item-details/${collectionAddress}/${id}`
  return axios.post(`${config.botApi}/bot/message`, {
    title: title,
    name: title,
    description,
    url,
    price,
    image,
    attributes
  })
}

const soldBotMessage = (data) => {
  const { id, title, description, price, assetURI: image, collectionAddress, attributes } = data
  const url = `https://operahouse.online/Item-details/${collectionAddress}/${id}`
  return axios.post(`${config.botApi}/bot/message`, {
    title: title,
    name: title,
    description,
    url,
    price,
    image,
    attributes
  })
}

export {
  newSaleBotMessage,
  soldBotMessage
}
