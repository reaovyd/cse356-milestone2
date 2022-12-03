import React, {useState, useEffect}from 'react';
import Crud from './Crud.js'
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const SignupPage = () => {
    const [nameText, setNameText] = useState('')
    const [passwordText, setPasswordText] = useState('')
    const [emailText, setEmailText] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        Crud.signupPost(nameText, passwordText, emailText).then(res => {
            if(res.data.error == true) {
                throw new Error(res.data.message)
            }
            console.log(res)
        }).catch(err => {
            console.error(err)
        })
    }

    const nameHandler = (e) => {
        e.preventDefault()
        setNameText(e.target.value)
    }

    const passwordHandler = (e) => {
        e.preventDefault()
        setPasswordText(e.target.value)
    }
    const emailHandler = (e) => {
        e.preventDefault()
        setEmailText(e.target.value)
    }
    return (
        <div className="login-main-box">
            <div className="flex-item-1">
                Signup page
            </div>
            <div className="flex-item-2">
                Name: <input type="text" onChange={nameHandler} value={nameText}></input>
            </div>
            <div className="flex-item-3">
                Password: <input type="password" onChange={passwordHandler} value={passwordText}></input>
            </div>
            <div className="flex-item-4">
                Email: <input type="text" onChange={emailHandler} value={emailText}></input>
            </div>
            <div className="flex-item-5">
                <div className="subflex-item-1">
                    <button onClick={handleSubmit}>Signup</button>
                </div>
            </div>
        </div>
    )
}

const LoginPage = () => {
    const [email, setEmailText] = useState('')
    const [passwordText, setPasswordText] = useState('')
    const navigate = useNavigate('')

    const handleLogin = (e) => {
        // console.log(email)
        // console.log(passwordText)
        Crud.loginPost(email, passwordText).then(res => {
            console.log(res.data)
            if(res.data.error == true) {
                throw new Error(res.data.message)
            } else {
                window.localStorage.setItem("name", res.data.name) 
                window.localStorage.setItem("sessionId", email) 
                navigate("/home")
            }
        }).catch(err => {
            console.error(err)
        })
    }

    const emailHandler = (e) => {
        e.preventDefault()
        setEmailText(e.target.value)
    }

    const passwordHandler = (e) => {
        e.preventDefault()
        setPasswordText(e.target.value)
    }



    return (
        <div className="login-main-box">
            <div className="flex-item-1">
                Login page
            </div>
            <div className="flex-item-2">
                Email: <input type="text" onChange={emailHandler} value={email}></input>
            </div>
            <div className="flex-item-3">
                Password: <input type="password" onChange={passwordHandler} value={passwordText}></input>
            </div>
            <div className="flex-item-4">
                <div className="subflex-item-1">
                    <button onClick={handleLogin}>Login</button>
                </div>
            </div>
        </div>
    )
}

const Login = () => {
    const [mode, setMode] = useState(0)
    const handleLinkClick = (e) => {
        if(mode == 0) {
            setMode(1)
        } else {
            setMode(0)
        }
    }
    return (
        <div>
            {mode ? <LoginPage /> : <SignupPage />}
            <div>
                {mode ? <a href="#" onClick={handleLinkClick}>Signup Page</a> : <a href="#" onClick={handleLinkClick}>Login Page</a>}
            </div>
        </div>
    )
}

export default Login;
