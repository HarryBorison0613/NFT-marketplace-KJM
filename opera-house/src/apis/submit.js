import axios from 'axios'
import { config } from '../constant/config'

const submit = (data) => {
  const url = config.submitURL
  return axios.post(url, data)
}

export {
  submit
}
