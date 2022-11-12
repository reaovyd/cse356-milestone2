// ... add imports and fill in the code
import * as Y from 'yjs';
import * as qd from "quill-delta-to-html"

class CRDTFormat {
  public bold?: Boolean = false;
  public italic?: Boolean = false;
  public underline?: Boolean = false;
};

exports.CRDT = class {
    cb : (update: string, isLocal: Boolean) => void;
    ytext : any;
    ydoc:any;
    constructor(cb: (update: string, isLocal: Boolean) => void) {
        this.cb = cb;
        this.ydoc = new Y.Doc();
        this.ytext = this.ydoc.getText("quill");
        ['update', 'insert', 'delete', 'toHTML'].forEach(f => (this as any)[f] = (this as any)[f].bind(this));
        this.ydoc.on("update", (update : Uint8Array, origin: any) => {
            const toSend = {
                data: Array.from(update),
            }
            const ret = JSON.stringify(toSend)
            this.cb(ret, origin === null)
        })
    }
    update(update: string) {
        const json = new Uint8Array(JSON.parse(update).data)
        Y.applyUpdate(this.ydoc, json, this.ydoc.clientID) 

        //if(json.event == "sync") {
        //    for(let update of json.data) {
        //        Y.applyUpdate(this.ydoc, update, this.ydoc.clientID)
        //    }
        //} else if(json.event == "update") {
        //    Y.applyUpdate(this.ydoc, json.data, this.ydoc.clientID)
        //}
    }
    insert(index: number, content: string, format: CRDTFormat) {
        this.ytext.insert(index, content, format)
    }
    delete(index: number, length: number) {
        this.ytext.delete(index, length)
    }
    insertImage(index: number, url: string) {
        this.ytext.applyDelta([{retain: index}, {
            insert : {
                image : url
            }
        }])
    }
    toHTML() {
        let arr = this.ytext.toDelta()
        return new qd.QuillDeltaToHtmlConverter(arr, {}).convert()
    }
};


/*
 exports.CRDT = class {
    cb : (update: string, isLocal: Boolean) => void;
    ytext : any;
    ydoc:any;
    constructor(cb: (update: string, isLocal: Boolean) => void) {
        this.cb = cb;
        this.ydoc = new Y.Doc();
        this.ytext = this.ydoc.getText("quill");
        ['update', 'insert', 'delete', 'toHTML'].forEach(f => (this as any)[f] = (this as any)[f].bind(this));
        this.ydoc.on("update", (update : Uint8Array, origin: any) => {
            const toSend = {
                data: Array.from(update),
                html: this.toHTML()
            }
            const ret = JSON.stringify(toSend)
            this.cb(ret, origin === null)
        })
    }
    update(update: string) {
        const json = JSON.parse(update)
        if(json.event == "sync") {
            const uint8Map = json.data.map((elem: any) => new Uint8Array(elem))
            for(let update of uint8Map) {
                Y.applyUpdate(this.ydoc, update, this.ydoc.clientID)
            }
        } else if(json.event == "update") {
            Y.applyUpdate(this.ydoc, new Uint8Array(json.data), this.ydoc.clientID)
        }
    }
    insert(index: number, content: string, format: CRDTFormat) {
        this.ytext.insert(index, content, format)
    }
    delete(index: number, length: number) {
        this.ytext.delete(index, length)
    }
    insertImage(index: number, url: string) {
        this.ytext.applyDelta([{retain: index}, {
            insert : {
                image : url
            }
        }])
    }
    toHTML() {
        let arr = this.ytext.toDelta()
        return new qd.QuillDeltaToHtmlConverter(arr, {}).convert()
    }
};
 * */
