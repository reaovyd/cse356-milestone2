import React, {useState} from "react";
import {useNavigate} from "react-router-dom";

function App() {
    const [value, setValue] = useState('')
    const navigate = useNavigate()
    const handleChange = (e) => {
        e.preventDefault()
        setValue(e.target.value)
    }
    const handleSubmit = (e) => {
        e.preventDefault()
        navigate(`/${value}`)
    }
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="text" value={value} onChange={handleChange} placeholder={"Document ID"}/>
        <button type="submit">Open</button>
      </form>
    </div>
  );
}

export default App;
