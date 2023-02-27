import {gql} from "apollo-server";

export const typeDefs = gql`

    extend type Query {
        getBlockchainMetadata(gameCode: String): BlockchainMetadata
        getGameConfig(gameCode: String): GameConfig
    }

    type BlockchainMetadata {
        chainId: String!
        contracts: [ContractMetadata!]!
        tokens: [TokenMetadata!]!
    }

    type ContractMetadata {
        name: String!
        address: String!
    }

    type TokenMetadata {
        symbol: ID!
        digits: Int!
        address: String!
    }

    type GameConfig {
        rtp: Float
        tokenConfigs: [TokenConfig]
    }

    type TokenConfig {
        token: TokenMetadata
        betAmount: BetAmountConfig
    }

    type BetAmountConfig {
        minAmount: Float
        maxAmount: Float
        defaultAmount: Float
    }

`;