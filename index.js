import express from 'express';
import bodyParser from "body-parser";
import { ApolloServer } from "apollo-server-express";
import cors from 'cors';

import { resolvers } from "./api/resolvers.js";
import { typeDefs } from "./api/schemas.js";
import { PORT } from "./config/config.js";

const server = new ApolloServer({ typeDefs, resolvers });
const app = express();

await server.start()
await server.applyMiddleware( { app } )

app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

app.listen({ port: PORT }, () => {
    console.log(`Server is running at http://localhost:${PORT}${server.graphqlPath}`)
})
