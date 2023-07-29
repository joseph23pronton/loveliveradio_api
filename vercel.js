const { createServer } = require('http');
const { ApolloServer } = require('apollo-server-micro');
const { typeDefs, resolvers } = require('./api'); // Import your typeDefs and resolvers here
const { albumModel, artistModel, memberModel, songModel } = require('./api/models'); // Import your mongoose models here

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: { albumModel, artistModel, memberModel, songModel }, // Provide your mongoose models to the context
});

const startServer = apolloServer.start();

module.exports = async function handler(req, res) {
  await startServer;
  await apolloServer.createHandler({
    path: '/api/graphql', // Set your GraphQL API path here
  })(req, res);
};
