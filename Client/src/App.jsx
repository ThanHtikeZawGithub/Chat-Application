import axios from 'axios';
import Routes from './Routes.jsx';
import  {UserContextProvider}  from './UserContext.jsx';

function App() {
  axios.defaults.baseURL = 'http://connect-api-seven.vercel.app';
  axios.defaults.withCredentials = true;
  return (
      <UserContextProvider>
      <Routes />
      </UserContextProvider>
   
  )
}

export default App;
