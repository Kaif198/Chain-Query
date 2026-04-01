import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import LandingPage from './components/LandingPage'

function Root() {
  const [entered, setEntered] = useState(false)

  return (
    <>
      {!entered ? (
         <LandingPage onEnter={() => setEntered(true)} />
      ) : (
        <div className="animate-in fade-in duration-300">
           <App onReset={() => setEntered(false)} />
        </div>
      )}
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
