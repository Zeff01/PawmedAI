
import { Request, Response, NextFunction } from 'express';

import { createClient } from '@supabase/supabase-js';

import dotenv from "dotenv";

dotenv.config()

if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase credentials in environment variables.");
}

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY)

export const authenticate_user = async (req:Request, res:Response, next: NextFunction) => {

    try {
        
        const auth_header = req.headers.authorization;

        const token = auth_header?.split(" ")[1];

        if(!token){

            res.status(401).json({
                Message: "Missing token"
            })
            
            return;
        }

        const { data, error } = await supabase.auth.getUser(token);

        if(error){

            res.status(403).json({

                Message: "Invalid token"
            })

            return;
        }

        (req as any).user = data.user?.id;

        next();

    } catch (error) {
        
        res.status(500);

        return;
    }
}

export const signup = async(req:Request, res:Response) => { 

    const { first_name, last_name,  username, email, password } = req.body;

    if(!first_name || !last_name || !username || !email || !password){

        res.status(400).json({

            Message: "Missing required fields."
        })
    }

    try {

        const { data, error } = await supabase.auth.signUp({

            email,
            password
        });
        
        if (error){
            
            res.status(400).json({ error: error.message });

            return;
        }
        
        const { error: dbError } = await supabase
        .from('users')
        .insert({
            uid: data.user?.id,   
            user_email: email,
            user_firstname: first_name,
            user_lastname: last_name,
            user_username: username
        });

        if (dbError) {
            
            res.status(500).json({ error: "Profile creation failed: " + dbError.message });
            return;
        }

        res.status(200).json({

            Message: "Check your email to confirm your sign up"
        });

        return;
        
    } catch (error: any) {
        
        res.status(500).json({

            Message: error
        });

        return;
    }
}

export const signin = async(req:Request, res:Response) => {
    
    const { email, password } = req.body;

    if(!email || !password){

        res.status(400).json({

            Message: "Missing Credentials"
        });

        return;
    }

    try {
        
        const { data, error } = await supabase.auth.signInWithPassword({

            email: email,
            password: password
        });

        if (error) {
            
            const { data, error } = await supabase.auth.resend({
                type: 'signup',
                email: email
            });

            res.status(401).json({ Message: `${error?.message}. Confirm your email` });
            
            return;
        }
    
            
        (req as any).user = data.user.id;

        res.status(200).json({
            Message: 'Login successful',
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            user: {
                id: data.user.id
            }
        });

        return;

    } catch (error: any) {

        console.log(error);
        
        res.status(500).json({

            Message: error.message
        });
    }
    
}

export const refresh_token = async (req: Request, res: Response) => {

    try {

        const { refresh_token } = req.body;

        if(!refresh_token){

            res.send(400).json({

                Message: "Missing refresh token"
            });
        }

        const { data, error} = await supabase.auth.refreshSession({

            refresh_token: refresh_token
        });

        if(error){

            res.status(403).json({

                Message: error.message
            });

            return;
        }

        res.status(200).json({
            access_token: data.session?.access_token,
            refresh_token: data.session?.refresh_token,
        });

        return;

        
    } catch (error: any) {
        
        console.log(error);
        
        res.status(500).json({

            Message: error.message
        });
    }
}

export const signout = async (req: Request, res:Response) => {

    try {

        const token = req.headers.authorization?.split(" ")[1];

        if(token){

            const { error } = await supabase.auth.signOut({scope: "global"});

            if(error){

                res.send(400).json({

                    Message: error.message
                });

                return;
            }

            console.log("Signed out!");
            

            res.status(200).json({

                Message: "Signed out"
            });
            
            return;
        }
        
        res.send(400).json({

            Message: "Missing Token"
        });

        return;

    } catch (error: any) {
        
        console.log(error);

        res.status(500).json({

            Message: error.mesage
        });
        
    }
}