import config from "../config/index.js";

import { ApolloServer } from "apollo-server";
import { buildSubgraphSchema } from "@apollo/subgraph";

import { resolvers } from "./resolvers.js";
import { typeDefs } from "./typeDefs.js";

const schema = buildSubgraphSchema([{ typeDefs, resolvers }]);

const server = new ApolloServer({ schema });

server.listen(process.env.PORT || config.port).then(({ url }) => {
    console.log(`🚀 Blockchain facade service ready at ${url}`);
});