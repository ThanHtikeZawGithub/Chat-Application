

const Avatar = ({ username, userId, online}) => {
    const colors = ['bg-red-500', 'bg-green-500', 'bg-purple-500',
                    'bg-blue-500', 'bg-yellow-500', 'bg-sky-500'];
    const userIdBase10 = parseInt(userId, 16);
    const colorIndex = userIdBase10 % colors.length;
    const color = colors[colorIndex];
    return (
        <div className={`w-8 h-8 relative ${color} rounded-full flex items-center`}>
            <div className="text-center w-full opacity-70">{username[0]}</div>
            {online && (
                <div className="absolute w-3 h-3 bg-green-500 bottom-0 right-0 rounded-full"></div>
            )}
            {!online && (
                <div className="absolute w-3 h-3 bg-gray-500 bottom-0 right-0 rounded-full"></div>
            )}
        </div>
    )
}

export default Avatar;