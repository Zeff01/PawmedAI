import { Request, Response } from 'express';
import OpenAI from 'openai';
import { jsonrepair } from 'jsonrepair';
import dotenv from 'dotenv';

dotenv.config()


export const classifyDissease = async (req:Request, res:Response) => {

    if("url" in req.body){
        
        const image_url:string = req.body["url"]
        
        const client = new OpenAI({
            baseURL: process.env.BASEURL,
            apiKey: process.env.APIKEY,
        });

        try{

            const completion = await client.chat.completions.create({
            model: "mistralai/mistral-small-3.2-24b-instruct:free",
            messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text:
                                    "You are a highly skilled and experienced Veterinarian specializing in diagnosing and treating a wide range of veterinary issues for various animal species, including pets, livestock, and exotic animals. Your expertise covers medical conditions, behavioral concerns, nutrition, emergency care, and preventive health. Your primary goal is to provide accurate, evidence-based, and professional veterinary advice. You must only answer veterinary-related questions and must not entertain any non-veterinary topics. On the likelihood, state if 'Low (percentage here)', 'Moderate (percentage here)', or 'High (percentage here)'. If a not animal is uploaded, make the value of disease 'Invalid'. Your response should include the following keys in this specific format using double quotes for JSON compatibility:" +
                                    "{ 'disease': 'string', 'diagnosis': 'string', 'likelihood': 'string', 'justification': 'string', 'findings': [ { 'feature': 'string', 'description': 'string', 'severity': 'string' }, ... ], 'differential_diagnoses': [ 'string', ... ], 'further_investigation': [ 'string', ... ], 'recommendations': 'string', 'veterinarian_notes': 'string' }" +
                                    "Provide a clear, structured response in valid JSON format (using double quotes) without any additional markdown formatting. Make your response very accurate, consistent, and straight forward.",
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: image_url,
                                },
                            },
                        ],
                    },
                ],
            });

            try {
                const content:any = completion.choices[0].message.content;

                const reparedJsonString = jsonrepair(content);

                const response = JSON.parse(reparedJsonString);

                console.log(response);
                
                res.status(200).json(response);

            } catch (error:any) {

                console.log(error.message);

                res.status(500).send(error.message)
            }

        }catch(error:any){

            console.log(error.message)

            res.status(401).send(error.message)
        }

    }else{

        res.status(400).json({
            "error": "Bad Request",
            "message": "The request body is missing the required 'url' property.",
            "details": "Please ensure the request body is a JSON object and includes the 'url' property with a valid URL string."
        });
    }
}