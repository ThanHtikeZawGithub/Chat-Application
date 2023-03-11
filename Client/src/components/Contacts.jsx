import React from 'react';
import Avatar from './Avatar';

const Contacts = ({id,selected,onClick, username,online}) => {
  return (
    <div key={id} className={`border-b-2 border-gray-300 pl-4 py-2 
    flex items-center gap-2 cursor-pointer ${selected? 'bg-sky-400' : ''}`}
   onClick={onClick}>
   <Avatar online={online} username={username} userId={id} />
   <span className='font-normal'>{username}</span>
    </div>)};

export default Contacts;