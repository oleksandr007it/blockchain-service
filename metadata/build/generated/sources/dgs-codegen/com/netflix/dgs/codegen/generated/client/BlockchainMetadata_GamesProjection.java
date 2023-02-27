package com.netflix.dgs.codegen.generated.client;

import com.netflix.graphql.dgs.client.codegen.BaseSubProjectionNode;

public class BlockchainMetadata_GamesProjection extends BaseSubProjectionNode<BlockchainMetadataProjectionRoot, BlockchainMetadataProjectionRoot> {
  public BlockchainMetadata_GamesProjection(BlockchainMetadataProjectionRoot parent,
      BlockchainMetadataProjectionRoot root) {
    super(parent, root, java.util.Optional.of("GameContract"));
  }

  public BlockchainMetadata_GamesProjection name() {
    getFields().put("name", null);
    return this;
  }

  public BlockchainMetadata_GamesProjection address() {
    getFields().put("address", null);
    return this;
  }

  public BlockchainMetadata_GamesProjection abi() {
    getFields().put("abi", null);
    return this;
  }
}
