
import express from 'express';
import bodyParser from 'body-parser';
import DB from '../src/V1/helpers/db';
import Routes from '../src/V1/index';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec  from '../config/swagger'
import cors from 'cors';
import helmet from 'helmet';
import authMiddleWare from '../src/V1/helpers/middlewares';
import path from "path";
const morgan = require("morgan");
import { cronFunction } from '../src/V1/Crons/crons.controller.js'

const useragent = require('express-useragent');
export default class Server {
    constructor(){
        this.app = null;
        this.db = null;
    }
    
    async initServer (){
        try{
            
            this.app = await express();
            this.app.use(useragent.express());
            this.app.use(bodyParser.json({ limit: '50mb' }));
            this.app.use(
                bodyParser.urlencoded({
                    extended:true
                }),
            );

            this.app.use(morgan("tiny"));
            this.app.use(
                cors({
                    exposedHeaders: [
                        'date',
                        'content-type',
                        'content-length',
                        'connection',
                        'server',
                        'x-powered-by',
                        'access-control-allow-origin',
                        'authorization',
                        'x-final-url'
                    ],
                    allowedHeaders: ['content-type', 'accept', 'authorization', 'cookie','secretkey'],
                }),
            )

            this.app.use(helmet());
            this.app.use(authMiddleWare);

            this.db = new DB();
            await this.db.init();
            await this.healthCheckRoute();
            await this.healthyDB();
            await this.configureRoutes(this.db);
            this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
            this.app.use(express.static(path.join(__dirname, "../", "public")));
          
    
            /* <---------------------- call cron function ------------------->*/
            cronFunction(await this.db.getDB());
            /* <---------------------- End  cron function ------------------->*/
            return this.app
        }catch (err){
            throw err;
        }
    }
    
    async healthCheckRoute(){
        try{
            this.app.get("/",(req,res)=>{
                res.json({ 
                    status:"Healthy",
                    msg:"This works perfectly fine",
                });
            });
        }catch (err){
            throw err;
        }
    }
 
    async healthyDB(){
        try{
            if(await this.db.checkConnection()){
                this.app.get('/health',(req,res)=>{
                    res.json({
                        msg:"DB Connection Successfull",
                    });
                });
                return;
            }
            throw new Error('Error connecting to DB')
        }catch(err){
            throw err;
        }
    }

    async configureRoutes(db){
        this.router = express.Router();
        const routes =  new Routes(this.router,db);
        await routes.routesRegistration();
        // this.app.use(this.router);
        this.app.use("/v1", cors(), this.router);
     }

}
