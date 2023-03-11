import React from 'react'
import { useContext } from 'react'
import RegisterAndLogin from './components/RegisterAndLogin'
import { UserContext } from './UserContext';
import Chat from './components/Chat';

const Routes = () => {
  const {username, id} = useContext(UserContext);

  if (username) {
    return <Chat/>
  }
  return (
    <div>
        <RegisterAndLogin/>
    </div>
  )
}

export default Routes;