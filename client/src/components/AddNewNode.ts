import type { FileNode, FileType } from '../types/types'


function AddNewNode(data:FileNode,parentId:string,type:FileType,name:string):FileNode {
    
  if(data.id===parentId){
    return {...data,
      children:[...(data.children || []),{
        id:Date.now().toString(),
        name,
        type,
        isExpanded: false,
        children:[]
      }]
    }
  }
  
  if(data.children){

    return {
      ...data,
      children:data.children.map((child)=>{
        return AddNewNode(child,parentId,type,name)
      })
    }
  }

  return data
 
}


function RenameNode(data:FileNode, targetId:string, newName:string):FileNode {
    
  if(data.id === targetId){
    return {
      ...data,
      name: newName
    }
  }
  
  if(data.children){
    return {
      ...data,
      children: data.children.map((child) => {
        return RenameNode(child, targetId, newName)
      })
    }
  }

  return data
}
function DeleteNode(data: FileNode, targetId: string): FileNode {
  if (data.children) {
    return {
      ...data,
      children: data.children
        .filter((child) => child.id !== targetId)
        .map((child) => DeleteNode(child, targetId))
    }
  }
  return data;
}
      
export {AddNewNode, RenameNode, DeleteNode}