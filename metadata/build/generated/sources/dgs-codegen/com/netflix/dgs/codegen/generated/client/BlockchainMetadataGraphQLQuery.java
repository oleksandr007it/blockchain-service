package com.netflix.dgs.codegen.generated.client;

import com.netflix.graphql.dgs.client.codegen.GraphQLQuery;
import java.lang.Override;
import java.lang.String;
import java.util.HashSet;
import java.util.Set;

public class BlockchainMetadataGraphQLQuery extends GraphQLQuery {
  public BlockchainMetadataGraphQLQuery(String blockchainCode, Set<String> fieldsSet) {
    super("query");
    if (blockchainCode != null || fieldsSet.contains("blockchainCode")) {
        getInput().put("blockchainCode", blockchainCode);
    }
  }

  public BlockchainMetadataGraphQLQuery() {
    super("query");
  }

  @Override
  public String getOperationName() {
     return "blockchainMetadata";
                    
  }

  public static Builder newRequest() {
    return new Builder();
  }

  public static class Builder {
    private Set<String> fieldsSet = new HashSet<>();

    private String blockchainCode;

    public BlockchainMetadataGraphQLQuery build() {
      return new BlockchainMetadataGraphQLQuery(blockchainCode, fieldsSet);
               
    }

    public Builder blockchainCode(String blockchainCode) {
      this.blockchainCode = blockchainCode;
      this.fieldsSet.add("blockchainCode");
      return this;
    }
  }
}
