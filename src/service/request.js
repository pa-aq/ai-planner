import axios from 'axios'

// 创建axios对象
const service = axios.create({
    baseURL:'http://42.121.255.10:5001',
    // baseURL:'http://127.0.0.1:5000',
    headers: {
        'Content-Type': 'application/json', // 默认请求头
        // 'Authorization': 'Bearer your_token_here', // 认证 token
      },
    withCredentials: true, // 允许携带凭证
})

// 请求拦截器
service.interceptors.request.use(
    config => {
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 响应拦截器
service.interceptors.response.use(
    response => {
        return response.data
    },
    error => {
        return Promise.reject(error)
    }
)

export default service