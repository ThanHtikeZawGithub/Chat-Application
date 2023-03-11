const mongoose = require ('mongoose');


const MessageSchema = new mongoose.Schema({
    sender: {type:mongoose.Schema.Types.ObjectId, ref: 'User'},  //by myself
    recipient: {type:mongoose.Schema.Types.ObjectId, ref:'User'},  
    text: String,
    file: String,
},{timestamps:true});


const MessagesModel = mongoose.model('Messages', MessageSchema);

module.exports = MessagesModel;