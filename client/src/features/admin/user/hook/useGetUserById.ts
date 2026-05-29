import { useQuery } from "@tanstack/react-query";
import api from "../../../../lib/axios";



export function useGetUserById(userId:string){

    return useQuery({
        queryKey:['user',userId],
        queryFn:async()=>{

            const response=await api.get(`/admin/user/${userId}`)

            return response.data.data;
        },
        staleTime: 0
    })
}