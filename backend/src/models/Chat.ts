import mongoose from 'mongoose';
const { Schema } = mongoose;

const MessageSchema = new Schema({
  role: { 
    type: String, 
    enum: ['user', 'model', 'system'], 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  }
}, { 
 
  timestamps: true 
});


const ChatSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
 
  folderId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Folder', 
    default: null, 
    index: true 
  },
  
  title: { 
    type: String, 
    default: 'New Research Chat',
    trim: true
  },

  messages: [MessageSchema], 
  

  contextParents: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Chat' 
  }], 
  

  summary: { 
    type: String, 
    default: null 
  }, 

  tokenCount: { 
    type: Number, 
    default: 0 
  }
  
}, { 

  timestamps: true 
});


ChatSchema.index({ userId: 1, folderId: 1 });

export const Chat = mongoose.model('Chat', ChatSchema);