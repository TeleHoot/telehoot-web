import axios from 'axios';

const url = import.meta.env.VITE_API

export const api = axios.create({
  baseURL: url + '/api/v1',
  withCredentials: true
})
