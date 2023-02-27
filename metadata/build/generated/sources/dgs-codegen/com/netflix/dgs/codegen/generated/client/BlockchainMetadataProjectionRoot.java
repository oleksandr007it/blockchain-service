package com.netflix.dgs.codegen.generated.client;

import com.netflix.graphql.dgs.client.codegen.BaseProjectionNode;

public class BlockchainMetadataProjectionRoot extends BaseProjectionNode {
  public BlockchainMetadata_TokensProjection tokens() {
    BlockchainMetadata_TokensProjection projection = new BlockchainMetadata_TokensProjection(this, this);    
    getFields().put("tokens", projection);
    return projection;
  }

  public BlockchainMetadata_GamesProjection games() {
    BlockchainMetadata_GamesProjection projection = new BlockchainMetadata_GamesProjection(this, this);    
    getFields().put("games", projection);
    return projection;
  }

  public BlockchainMetadata_BetslipProjection betslip() {
    BlockchainMetadata_BetslipProjection projection = new BlockchainMetadata_BetslipProjection(this, this);    
    getFields().put("betslip", projection);
    return projection;
  }

  public BlockchainMetadataProjectionRoot id() {
    getFields().put("id", null);
    return this;
  }

  public BlockchainMetadataProjectionRoot code() {
    getFields().put("code", null);
    return this;
  }

  public BlockchainMetadataProjectionRoot name() {
    getFields().put("name", null);
    return this;
  }

  public BlockchainMetadataProjectionRoot rpcUrl() {
    getFields().put("rpcUrl", null);
    return this;
  }

  public BlockchainMetadataProjectionRoot explorerUrl() {
    getFields().put("explorerUrl", null);
    return this;
  }
}
