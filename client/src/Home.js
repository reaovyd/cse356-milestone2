import React, {useEffect, useState}from "react";
import {Link, useNavigate} from "react-router-dom";
import Crud from "./Crud";
import "./Home.css"

const ListLink = ({id, setDisplay}) => {
    const deleteHandler = (e) => {
        e.preventDefault()
        Crud.deleteDocument(id).then(res => {
            if(res.data.error == true) {
                throw new Error(res.data.message)
            }
            Crud.getTopTenDocuments().then(res => {
                if(res.data.error == true) {
                    throw new Error(res.data.message)
                }
                setDisplay(res.data.map((elem, i)=> {
                    return (
                        <div className={"class-documents"} key={i}> 
                            <Link className={"sub-document"}to={`/edit/${elem.id}`}>{elem.id}</Link>
                            <span className={"sub-document"}>{elem.name}</span>
                            <ListLink id={elem.id} setDisplay={setDisplay}/>
                        </div>
                    )
                }))
            }).catch(err => {
                console.error(err)
            })
        }).catch(err => {
            console.error(err)
        })
    }
    return (
        <a onClick={deleteHandler} className={"sub-document"}href="#">Delete</a>
    )
}

const Home = () => {
    const navigate = useNavigate('')
    const [display, setDisplay] = useState([])
    const [documentName, setDocumentName] = useState('')

    useEffect(() => {
        Crud.getTopTenDocuments().then(res => {
            if(res.data.error == true) {
                throw new Error(res.data.message)
            }
            setDisplay(res.data.map((elem, i)=> {
                return (
                    <div className={"class-documents"} key={i}> 
                        <Link className={"sub-document"}to={`/edit/${elem.id}`}>{elem.id}</Link>
                        <span className={"sub-document"}>{elem.name}</span>
                        <ListLink id={elem.id} setDisplay={setDisplay}/>
                    </div>
                )
            }))
        }).catch(err => {
            console.error(err)
        })
    }, [])
    const logoutHandler = (e) => {
        e.preventDefault()
        Crud.logoutPost().then(res => {
            if(res.data.error == true) {
                throw new Error(res.data.message)
            }
            window.localStorage.removeItem("name")
            navigate("/")
        }).catch(err => {
            console.error(err)
        })
    }
    const formHandler = (e) =>{
        e.preventDefault()
        Crud.createDocument(documentName).then(res => {
            if(res.data.error == true) {
                throw new Error(res.data.message)
            }
            Crud.getTopTenDocuments().then(res => {
                if(res.data.error == true) {
                    throw new Error(res.data.message)
                }
                setDisplay(res.data.map((elem, i)=> {
                    return (
                        <div className={"class-documents"} key={i}> 
                            <Link className={"sub-document"}to={`/edit/${elem.id}`}>{elem.id}</Link>

                            <span className={"sub-document"}>{elem.name}</span>
                            <ListLink id={elem.id} setDisplay={setDisplay}/>
                        </div>
                    )
                }))
            }).catch(err => {
                console.error(err)
            })
        }).catch(err =>{
            console.error(err)
        })

    }
    const handleDocumentNameText = (e) => {
        e.preventDefault()
        setDocumentName(e.target.value)
    }
    return (
        <div>
            <form onSubmit={formHandler}>
                <label htmlFor="name">
                    Document name:
                </label>
                <input onChange={handleDocumentNameText} type="text" value={documentName} id="name" name="name"/>
                <input type="submit" value="Submit"/>
            </form>
            <br/>
            {display} 
            <button onClick={logoutHandler}>Logout</button>
        </div>
    )
}

export default Home;
