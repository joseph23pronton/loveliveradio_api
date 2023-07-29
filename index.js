import express from 'express';
import bodyParser from "body-parser";
import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import cors from 'cors';
import http from "http";

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
app.use(express.json());

const httpServer = http.createServer(app);

app.listen({ port: PORT }, () => {
    console.log(`Server is running at http://localhost:${PORT}${server.graphqlPath}`)
})

const startApolloServer = async(app, httpServer) => {
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    });
  
    await server.start();
    server.applyMiddleware({ app });
  }

  startApolloServer(app, httpServer);

export default httpServer;