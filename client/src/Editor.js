import React, {useState, useCallback} from "react";
import {useParams} from "react-router-dom";
import Quill from "quill";
import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
import 'quill/dist/quill.snow.css'
import axios from "axios";
import * as Y from 'yjs'
import { QuillBinding } from 'y-quill'
import QuillCursors from "quill-cursors"; 
import Cookies from 'js-cookie'
Quill.register('modules/cursors', QuillCursors);

const baseUrl = `http://jasons.cse356.compas.cs.stonybrook.edu`
// const baseUrl = `http://localhost:8080`


const Editor = () => {
    const { id } = useParams()

    const wrapperRef = useCallback(wrapper => {
        if(wrapper == null) return
        const doc = new Y.Doc()
        const type = doc.getText("quill")
        const sse = new EventSource(`${baseUrl}/api/connect/${id}`, {withCredentials: true})
        var myToolbar= [
            ['bold', 'italic', 'underline', 'strike'],       
            ['blockquote', 'code-block'],

            [{ 'color': [] }, { 'background': [] }],         
            [{ 'font': [] }],
            [{ 'align': [] }],

            ['clean'],
            ['image']
        ];

 
        wrapper.innerHTML = ""
        const editor = document.createElement("div")
        wrapper.append(editor)

 
        const quill = new Quill(editor, {theme:'snow',
        modules: {
            toolbar: {
                container: myToolbar,
            },
            cursors: true
        }})
        const binding = new QuillBinding(type, quill)
        const cursors = quill.getModule('cursors');

        const sessionId = window.localStorage.getItem("sessionId") 
        const name = window.localStorage.getItem("name")


        doc.on("update", (update, origin) => {
            if(origin == null) { // TODO null if user is not the one that typed but loaded by api
            } else {
                const sendData = {
                    data : Array.from(update)
                }
                axios.post(`${baseUrl}/api/op/${id}`, sendData, {withCredentials: true}).then(res => {
                }).catch(err => {
                    console.log(err)
                })
            }
        })



        quill.on("selection-change", function(range, oldRange, source) {
            if(range) {
                cursors.moveCursor(sessionId, range) 
                axios.post(`${baseUrl}/api/presence/${id}`,{
                    index:range.index, 
                    length: range.length
                }, {withCredentials:true}).then(res => {
                }).catch(err => {
                    console.error(err)
                })
            }
        })

 
        sse.addEventListener("sync", (e) => {
            const parsedJson = new Uint8Array(JSON.parse(e.data).data)
            Y.applyUpdate(doc, parsedJson, null)
            cursors.createCursor(sessionId, name, "blue")
            cursors.toggleFlag(sessionId, true)
        })
        sse.addEventListener("update", (e) =>{
            const parsedJson = new Uint8Array(JSON.parse(e.data).data)
            Y.applyUpdate(doc, parsedJson, null)
        })

        sse.addEventListener("presence", (e) => {
            const json = JSON.parse(e.data)
            if(json.session_id !== sessionId) {
                cursors.createCursor(json.session_id, json.name, "green")
                cursors.toggleFlag(json.session_id, true)
                cursors.moveCursor(json.session_id, json.cursor)
            }
        })
        sse.onerror = () => {
            console.log("CLOSING SESSION")
            sse.close()
        }
    }, [])
    return (
        <div id="editor" ref={wrapperRef}>
        </div>
    )
}

export default Editor;

