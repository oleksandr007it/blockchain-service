package com.netflix.dgs.codegen.generated.client;

import com.netflix.graphql.dgs.client.codegen.BaseSubProjectionNode;

public class BlockchainMetadata_BetslipProjection extends BaseSubProjectionNode<BlockchainMetadataProjectionRoot, BlockchainMetadataProjectionRoot> {
  public BlockchainMetadata_BetslipProjection(BlockchainMetadataProjectionRoot parent,
      BlockchainMetadataProjectionRoot root) {
    super(parent, root, java.util.Optional.of("BetslipContract"));
  }

  public BlockchainMetadata_BetslipProjection address() {
    getFields().put("address", null);
    return this;
  }

  public BlockchainMetadata_BetslipProjection abi() {
    getFields().put("abi", null);
    return this;
  }
}
