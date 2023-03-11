import React from 'react';
import { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../UserContext';
import Logo from './logo';
import { uniqBy } from 'lodash';
import axios from 'axios';
import Contacts from './Contacts.jsx';

const Chat = () => {
    const [ws, setWs] = useState(null);
    const [onlinePeople, setOnlinePeople] = useState({});
    const [chatting, setChatting] = useState(null);
    const [newMessages, setNewMessages] = useState('');
    const [popMessages, setPopMessages] = useState([]);
    const [offlinePeople, setOfflinePeople] = useState({});
    const divUnderMessages = useRef();
    useEffect(() => {
        connectToWs();

    }, []);

    function connectToWs() {
        const ws = new WebSocket('ws://localhost:4040');
        setWs(ws);                                          //reconnect server automatically
        ws.addEventListener('message', handleMessage)
        ws.addEventListener('close', () => {
            setTimeout(() => {
                console.log('Trying to reconnect');
            }, 1000)
        });
    }

    function handleMessage(ev) {
        const messageData = JSON.parse(ev.data);
        console.log({ ev, messageData });
        if ('online' in messageData) {              //who is online and who is sending message through the websocket connection
            showOnlinePeople(messageData.online);
        } else if ('text' in messageData) {
            if (messageData.sender === chatting) {
                setPopMessages(prev => ([...prev, { ...messageData }]));  //receive from others
            }
        }
    }

    function showOnlinePeople(Allpeople) {
        const people = {};
        Allpeople.forEach(({ userId, username }) => {
            people[userId] = username;
        });
        setOnlinePeople(people);
    }

    useEffect(() => {
        axios.get('/people').then(res => {
            const offlinePersonArr = res.data
                .filter(p => p._id !== id)
                .filter(p => !Object.keys(onlinePeople).includes(p._id));
            const offlinePerson = {};
            offlinePersonArr.forEach(p => {           //to be same behavior as online people
                offlinePerson[p._id] = p;
            })
            setOfflinePeople(offlinePerson);
        })
    }, [onlinePeople]);


    function sendMessage(ev, file = null) {
        if (ev) ev.preventDefault();
        ws.send(JSON.stringify({
            recipient: chatting,           //recipient => who receive msg
            text: newMessages,              //send by me
            file,
        }));
        if (file) {
            axios.get('/messages/' + chatting).then(res => {
                setPopMessages(res.data);
            });
        } else {
            setNewMessages('');
            setPopMessages(prev => ([...prev, {
                text: newMessages,
                sender: id,
                recipient: chatting,
                _id: Date.now()
            }]))
        };

    }

    function sendFile(ev) {
        const reader = new FileReader();
        reader.readAsDataURL(ev.target.files[0]);
        reader.onload = () => {
            sendMessage(null, {
                name: ev.target.files[0].name,
                data: reader.result,
            });
        }

    }

    useEffect(() => {
        if (chatting) {
            axios.get('/messages/' + chatting).then(res => {
                setPopMessages(res.data);                   //we are adding back to popmessages everytime we refreshed
            })
        }
    }, [chatting])

    function logout() {
        axios.post('/logout').then(() => {
            setWs(null);
            setUsername(null);
            setId(null);
        })
    };




    const { id, setId, setUsername, username } = useContext(UserContext);
    const WithoutCurrentUser = { ...onlinePeople };
    delete WithoutCurrentUser[id];

    //get rid of duplicate messages due to mapping that cause renderings
    const NoDuplicateMessage = uniqBy(popMessages, '_id');

    // console.log(NoDuplicateMessage)

    useEffect(() => {
        const div = divUnderMessages.current;
        if (div) {
            div.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [popMessages]);

    return (
        <div className='flex h-screen'>
            <div className="bg-blue-100 w-1/3 relative">
                <div className='text-blue-500 font-bold mx-2 flex gap-2 p-2 mb-4'>
                    <Logo />
                    Connect
                </div>
                {Object.keys(WithoutCurrentUser).map((userId) =>
                    <Contacts
                        key={userId}
                        id={userId}
                        online={true}
                        selected={userId === chatting}
                        username={WithoutCurrentUser[userId]}
                        onClick={() => setChatting(userId)}
                    />)};
                {Object.keys(offlinePeople).map((userId) =>
                    <Contacts
                        key={userId}
                        id={userId}
                        online={false}
                        selected={userId === chatting}
                        username={offlinePeople[userId].username}
                        onClick={() => setChatting(userId)}
                    />)};
                <div className='absolute flex items-center justify-between bottom-0 mb-10 ml-auto gap-4'>
                    <div className='flex justify-between items-center ml-4 gap-3'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                        </svg>
                        {username}
                    </div>
                    <button onClick={logout} className='bg-slate-500 rounded-lg p-2 hover:scale-105'>Logout</button>
                </div>
            </div>
            <div className="bg-blue-300 w-2/3 flex flex-col m-2 p-2">
                <div className='flex-grow'>
                    {!chatting && (
                        <div className="flex h-full flex-grow items-center justify-center">
                            <div className="text-gray-300">&larr; Select a person from the sidebar</div>
                        </div>
                    )}

                    {!!chatting && (
                        <div className='relative h-full'>
                            <div className=' absolute overflow-y-scroll inset-0'>
                                {NoDuplicateMessage.map(message => (
                                    <div className={`${message.sender === id ? 'text-right' : 'text-left'}`}>
                                        <div key={message.id}
                                            className={`${message.sender === id ? 'bg-blue-500 text-white' : 'bg-white text-gray-500'}
                                                p-2 my-2 rounded-md text-sm inline-block`}>
                                            {message.text}
                                            {message.file && (
                                                <div className='flex'>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                                        <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" />
                                                    </svg>

                                                    <a target='_blank' className='flex items-center border-b' href={axios.defaults.baseURL + '/files/' + message.file}>
                                                        {message.file}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={divUnderMessages}></div>
                            </div>

                        </div>

                    )}
                </div>
                {!!chatting && (
                    <form className='flex gap-2 items-center'
                        onSubmit={sendMessage}>
                        <input
                            type='text'
                            value={newMessages}
                            onChange={e => setNewMessages(e.target.value)}
                            placeholder='Type your messgage here'
                            className='bg-white border p-2 flex-grow' />
                        <label className=''>
                            <input type='file' className='hidden' onChange={sendFile} />
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" />
                            </svg>
                        </label>
                        <button type='submit' className='bg-blue-500 p-2 text-white '>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>

                        </button>
                    </form>
                )}
            </div>


        </div>
    )
};

export default Chat;