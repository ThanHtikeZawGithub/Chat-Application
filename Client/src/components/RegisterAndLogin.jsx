import { useState, useContext } from "react"
import axios from 'axios';
import { UserContext } from "../UserContext";
import login_img from '../assets/login.jpg';

const RegisterAndLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterOrLogin, setIsRegisterOrLogin] = useState('register');
  const { setUsername: setLoggedInUser, setId } = useContext(UserContext);

  async function SubmitHandler(e) {
    e.preventDefault();
    const url = isRegisterOrLogin === 'register' ? 'register' : 'login';
    const { data } = await axios.post(url, { username, password });
    setLoggedInUser(username);
    setId(data.id);
  };


  return (
    <div className="h-screen bg-cover flex items-center "
    style={{ backgroundImage: `url(${login_img})`}}>
      <form className='w-64 mx-auto mb-12' onSubmit={SubmitHandler} >
        <input type='text'
          placeholder='Username'
          value={username}
          onChange={e => setUsername(e.target.value)}
          className='block w-full mb-2 border-black rounded-lg p-2 shadow-lg'

        />
        <input type='password'
          placeholder='Password'
          value={password}
          onChange={e => setPassword(e.target.value)}
          className='block w-full p-2 mb-2 border rounded-lg shadow-lg'

        />
        <button className='bg-lime-600 text-white block w-full p-2 rounded-lg active:scale-95'>
          {isRegisterOrLogin === 'register' ? 'Register' : 'Login'}</button>
        <div className="mt-4 flex justify-center">
          {isRegisterOrLogin === 'register' && (
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-gray-700">Already a member?</div>
              <button onClick={() => setIsRegisterOrLogin('login')} className="bg-white opacity-60 rounded-lg p-2 text-sm">Login Here</button>
            </div>
          )}
          {isRegisterOrLogin === 'login' && (
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-gray-700">Don't have account?</div>
              <button onClick={() => setIsRegisterOrLogin('register')}
              className="text-sm p-2 bg-white opacity-60 rounded-xl">Register Here</button>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}

export default RegisterAndLogin;