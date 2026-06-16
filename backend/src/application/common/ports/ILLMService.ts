

interface ILLMService{
    classifyIntent(message:string):Promise<{isValidWorkspaceRequest:boolean,targetFolder:null|string ,topicToLearn:null|string}>
}