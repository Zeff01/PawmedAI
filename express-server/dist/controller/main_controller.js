"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyDissease = void 0;
const openai_1 = __importDefault(require("openai"));
const jsonrepair_1 = require("jsonrepair");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const classifyDissease = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if ("url" in req.body) {
        const image_url = req.body["url"];
        console.log("HELLO AL");
        console.log(process.env.BASEURL);
        console.log(process.env.APIKEY);
        const client = new openai_1.default({
            baseURL: process.env.BASEURL,
            apiKey: process.env.APIKEY,
        });
        try {
            const completion = yield client.chat.completions.create({
                model: "mistralai/mistral-small-3.2-24b-instruct:free",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "You are a highly skilled and experienced Veterinarian specializing in diagnosing and treating a wide range of veterinary issues for various animal species, including pets, livestock, and exotic animals. Your expertise covers medical conditions, behavioral concerns, nutrition, emergency care, and preventive health. Your primary goal is to provide accurate, evidence-based, and professional veterinary advice. You must only answer veterinary-related questions and must not entertain any non-veterinary topics. On the likelihood, state if 'Low (percentage here)', 'Moderate (percentage here)', or 'High (percentage here)'. If a not animal is uploaded, make the value of disease 'Invalid'. Your response should include the following keys in this specific format using double quotes for JSON compatibility:" +
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
                const content = completion.choices[0].message.content;
                const reparedJsonString = (0, jsonrepair_1.jsonrepair)(content);
                const response = JSON.parse(reparedJsonString);
                console.log(response);
                res.status(200).json(response);
            }
            catch (error) {
                console.log(error.message);
                res.status(500).send(error.message);
            }
        }
        catch (error) {
            console.log(error.message);
            res.status(401).send(error.message);
        }
    }
    else {
        res.status(400).json({
            "error": "Bad Request",
            "message": "The request body is missing the required 'url' property.",
            "details": "Please ensure the request body is a JSON object and includes the 'url' property with a valid URL string."
        });
    }
});
exports.classifyDissease = classifyDissease;
