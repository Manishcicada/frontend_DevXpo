import Form from "./pages/Form"
import Home from "./pages/Home"
import {Routes, Route} from 'react-router-dom'

import useStore from "./store/useStore"

function App() {

  const formSubmitted = useStore(state=>state.formSubmitted)
  const response = useStore(state=>state.response)

  console.log(response);

  return (
    <>
      <Routes>
        <Route path="/" element={formSubmitted?<Home/>:<Form/>}/>
        <Route path="/details" element={<Form/>}/>
      </Routes>
    </>
  )
}

export default App
