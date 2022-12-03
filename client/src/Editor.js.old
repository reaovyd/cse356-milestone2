// import React, {useState, useCallback} from "react";
// import {useParams} from "react-router-dom";
// import Quill from "quill";
// import 'quill/dist/quill.snow.css'
// import axios from "axios";
// import * as Y from 'yjs'
// import { QuillBinding } from 'y-quill'
// 
// const Editor = () => {
//     const { id } = useParams()
//     const wrapperRef = useCallback(wrapper => {
//         if(wrapper == null) return
//         const sse = new EventSource(`http://localhost:8080/api/connect/${id}`)
// 
//         wrapper.innerHTML = ""
//         const editor = document.createElement("div")
//         wrapper.append(editor)
//         const doc = new Y.Doc()
//         var type = doc.getText("quill")
// 
//         const quill = new Quill(editor, {theme:'snow'})
//         const binding = new QuillBinding(type, quill)
// 
//         sse.addEventListener("sync", (e) => {
//             console.log(`SYNCED`)
//             const lst = JSON.parse(e.data)
//             lst.forEach(elem => {
//                 type.applyDelta(elem)
//             })
//         })
// 
//         sse.addEventListener("update", (e) => {
//             const json = JSON.parse(e.data)
//             const lst = json.delta
//             const post_id = json.post_id
//             if(post_id !== doc.clientID) {
//                 type.applyDelta(lst)
//             }
//         })
// 
//         quill.on("text-change", (delta, oldContents, source) => {
//             if(source !== "user") {
//                 return
//             }
//             axios.post(`http://localhost:8080/api/op/${id}`, {delta: delta.ops, post_id : doc.clientID}).then(res => {
//             }).catch(err => {
//             })
//         })
//     }, [])
//     return (
//         <div id="editor" ref={wrapperRef}>
//         </div>
//     )
// }
// 
// export default Editor;
