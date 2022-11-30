import axios from 'axios'

// const baseUrl = "http://jasons.cse356.compas.cs.stonybrook.edu"
const baseUrl = "http://209.94.58.45:80"

const signupPost = async (name, password, email) => {
    const data = {
        name,
        password,
        email
    }

    return await axios.post(`${baseUrl}/users/signup`, data)
}

const loginPost = async (email, password) => {
    const data = {
        password,
        email
    }
    return await axios.post(`${baseUrl}/users/login`, data, {withCredentials: true})
}

const logoutPost = async () => {
    return await axios.post(`${baseUrl}/users/logout`, {}, {
        withCredentials: true,
    })
}

const getTopTenDocuments = async() => {
    return await axios.get(`${baseUrl}/collection/list`, {withCredentials: true})
}

const deleteDocument = async(id) => {
    const data = {
        id: id
    }
    return await axios.post(`${baseUrl}/collection/delete`, data,{withCredentials: true})
}

const createDocument = async(name) => {
    const data = {
        name
    }
    return await axios.post(`${baseUrl}/collection/create`, data,{withCredentials: true})
}

export default {loginPost, signupPost, logoutPost, 
    getTopTenDocuments, deleteDocument, createDocument};
