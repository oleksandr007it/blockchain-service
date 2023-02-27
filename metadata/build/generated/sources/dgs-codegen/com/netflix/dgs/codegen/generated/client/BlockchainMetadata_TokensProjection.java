package com.netflix.dgs.codegen.generated.client;

import com.netflix.graphql.dgs.client.codegen.BaseSubProjectionNode;

public class BlockchainMetadata_TokensProjection extends BaseSubProjectionNode<BlockchainMetadataProjectionRoot, BlockchainMetadataProjectionRoot> {
  public BlockchainMetadata_TokensProjection(BlockchainMetadataProjectionRoot parent,
      BlockchainMetadataProjectionRoot root) {
    super(parent, root, java.util.Optional.of("Token"));
  }

  public BlockchainMetadata_Tokens_TypeProjection type() {
     BlockchainMetadata_Tokens_TypeProjection projection = new BlockchainMetadata_Tokens_TypeProjection(this, getRoot());
     getFields().put("type", projection);
     return projection;
  }

  public BlockchainMetadata_TokensProjection symbol() {
    getFields().put("symbol", null);
    return this;
  }

  public BlockchainMetadata_TokensProjection digits() {
    getFields().put("digits", null);
    return this;
  }

  public BlockchainMetadata_TokensProjection address() {
    getFields().put("address", null);
    return this;
  }

  public BlockchainMetadata_TokensProjection abi() {
    getFields().put("abi", null);
    return this;
  }
}
