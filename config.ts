import { AssemblyAI } from "assemblyai";
import { v2 as cloudinary } from 'cloudinary';
import { ChatOpenAI } from "@langchain/openai";
import { AiResponseFormat } from "./zod/schema";

const getCloud = () => {
    
    cloudinary.config({
        
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        
        api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
        
        api_secret: process.env.CLOUDINARY_API_SECRET,
        
    })

    return cloudinary

}

const getModel = () => {

    const model = new ChatOpenAI({ 
    
        model : "deepseek-v4-flash", 
        apiKey : process.env.OPENAI_API_KEY,
        configuration : {
    
            baseURL : "https://api.deepseek.com"
        }
    
    })
    

    const structuredModel =  model.withStructuredOutput( AiResponseFormat , {

        method : "jsonMode"
    
    })
    
    return { structuredModel , model }

}



const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY || "" });

export { client , getCloud , getModel }