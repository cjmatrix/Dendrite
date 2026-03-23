import { Request, Response } from "express";
import { Message } from "../models/Message";
import { createCard, updateCard, getDueCards, deleteCard, clearAllCards } from "../services/recallService"


export const creatingCard=async(req: any,res: any)=>{

    let {content,chatId,msgId=null}=req.body;
    if(!content && msgId){
        const message = await Message.findById(msgId);
        if(message) {
            content = message.content;
        }
    }


    const result=await createCard(req.user._id,content,chatId)

    res.status(201).json({success:true,data:result})
}

export const updatingCard=async (req:any,res:any)=>{
    const cardId= req.params.id as string;
    const {rating}=req.body;
    let parsedRating=parseInt(rating)

    const result=await updateCard(req.user._id,cardId,parsedRating);

    res.status(200).json({success:true,data:result})
}

export const gettingDueCards=async (req:any,res:any)=>{
    const dueCards = await getDueCards(req.user._id);
    res.status(200).json({success:true, data:dueCards});
}

export const deletingCard = async (req: any, res: any) => {
    await deleteCard(req.user._id, req.params.id);
    res.status(200).json({ success: true, message: "Card deleted" });
}

export const clearingCards = async (req: any, res: any) => {
    await clearAllCards(req.user._id);
    res.status(200).json({ success: true, message: "All cards cleared" });
}