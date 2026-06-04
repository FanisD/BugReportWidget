import './App.css'
import BugReportWidget from './components/BugReportWidget'

function App() {

  return (
    <>

    <BugReportWidget apiUrl="http://localhost:5000/api/bug-report" />

    </>
  )
}

export default App