import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://user205425413-l3b6vxuu.tunnel.vk-apps.com/api/v1',
  withCredentials: true
})
