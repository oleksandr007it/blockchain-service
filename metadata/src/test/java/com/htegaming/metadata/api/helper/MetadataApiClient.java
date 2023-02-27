package com.htegaming.metadata.api.helper;

import com.jayway.jsonpath.TypeRef;
import com.netflix.dgs.codegen.generated.types.Blockchain;
import com.netflix.graphql.dgs.DgsQueryExecutor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MetadataApiClient {

    @Autowired
    private DgsQueryExecutor queryExecutor;

    private static final String BLOCKCHAIN_METADATA_QUERY = """
            {
                  blockchainMetadata(blockchainCode: "$blockchainCode") {
                    id
                    code
                    name
                    rpcUrl
                    explorerUrl
                    tokens {
                    symbol
                    digits
                    type
                    address
                    abi
                    }
                    games {
                    name
                    address
                    abi
                    }
                    betslip{
                    address
                    abi
                    }
                  }
                }
            """;

    public List<Blockchain> getBlockchainMetadata(String blockchainCode) {
        String query = BLOCKCHAIN_METADATA_QUERY.replaceAll("\\$blockchainCode", blockchainCode);
        return queryExecutor.executeAndExtractJsonPathAsObject(query, "$.data.blockchainMetadata", new TypeRef<>() {
        });
    }
}
