import mongoose from 'mongoose';
const { Schema } = mongoose;

const FolderSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  

  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  
  parentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Folder', 
    default: null,
    index: true
  },
  isSystemFolder:{
    type:Boolean,
    default:false
  },
  color: { 
    type: String, 
    default: 'default' 
  },
  isExpanded: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true 
});


FolderSchema.index({ userId: 1, parentId: 1 });

export const Folder = mongoose.model('Folder', FolderSchema);