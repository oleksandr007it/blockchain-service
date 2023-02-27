package com.netflix.dgs.codegen.generated.types;

import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.util.List;

public class Blockchain {
  private String id;

  private String code;

  private String name;

  private String rpcUrl;

  private String explorerUrl;

  private List<Token> tokens;

  private List<GameContract> games;

  private BetslipContract betslip;

  public Blockchain() {
  }

  public Blockchain(String id, String code, String name, String rpcUrl, String explorerUrl,
      List<Token> tokens, List<GameContract> games, BetslipContract betslip) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.rpcUrl = rpcUrl;
    this.explorerUrl = explorerUrl;
    this.tokens = tokens;
    this.games = games;
    this.betslip = betslip;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getCode() {
    return code;
  }

  public void setCode(String code) {
    this.code = code;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getRpcUrl() {
    return rpcUrl;
  }

  public void setRpcUrl(String rpcUrl) {
    this.rpcUrl = rpcUrl;
  }

  public String getExplorerUrl() {
    return explorerUrl;
  }

  public void setExplorerUrl(String explorerUrl) {
    this.explorerUrl = explorerUrl;
  }

  public List<Token> getTokens() {
    return tokens;
  }

  public void setTokens(List<Token> tokens) {
    this.tokens = tokens;
  }

  public List<GameContract> getGames() {
    return games;
  }

  public void setGames(List<GameContract> games) {
    this.games = games;
  }

  public BetslipContract getBetslip() {
    return betslip;
  }

  public void setBetslip(BetslipContract betslip) {
    this.betslip = betslip;
  }

  @Override
  public String toString() {
    return "Blockchain{" + "id='" + id + "'," +"code='" + code + "'," +"name='" + name + "'," +"rpcUrl='" + rpcUrl + "'," +"explorerUrl='" + explorerUrl + "'," +"tokens='" + tokens + "'," +"games='" + games + "'," +"betslip='" + betslip + "'" +"}";
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Blockchain that = (Blockchain) o;
        return java.util.Objects.equals(id, that.id) &&
                            java.util.Objects.equals(code, that.code) &&
                            java.util.Objects.equals(name, that.name) &&
                            java.util.Objects.equals(rpcUrl, that.rpcUrl) &&
                            java.util.Objects.equals(explorerUrl, that.explorerUrl) &&
                            java.util.Objects.equals(tokens, that.tokens) &&
                            java.util.Objects.equals(games, that.games) &&
                            java.util.Objects.equals(betslip, that.betslip);
  }

  @Override
  public int hashCode() {
    return java.util.Objects.hash(id, code, name, rpcUrl, explorerUrl, tokens, games, betslip);
  }

  public static com.netflix.dgs.codegen.generated.types.Blockchain.Builder newBuilder() {
    return new Builder();
  }

  public static class Builder {
    private String id;

    private String code;

    private String name;

    private String rpcUrl;

    private String explorerUrl;

    private List<Token> tokens;

    private List<GameContract> games;

    private BetslipContract betslip;

    public Blockchain build() {
                  com.netflix.dgs.codegen.generated.types.Blockchain result = new com.netflix.dgs.codegen.generated.types.Blockchain();
                      result.id = this.id;
          result.code = this.code;
          result.name = this.name;
          result.rpcUrl = this.rpcUrl;
          result.explorerUrl = this.explorerUrl;
          result.tokens = this.tokens;
          result.games = this.games;
          result.betslip = this.betslip;
                      return result;
    }

    public com.netflix.dgs.codegen.generated.types.Blockchain.Builder id(String id) {
      this.id = id;
      return this;
    }

    public com.netflix.dgs.codegen.generated.types.Blockchain.Builder code(String code) {
      this.code = code;
      return this;
    }

    public com.netflix.dgs.codegen.generated.types.Blockchain.Builder name(String name) {
      this.name = name;
      return this;
    }

    public com.netflix.dgs.codegen.generated.types.Blockchain.Builder rpcUrl(String rpcUrl) {
      this.rpcUrl = rpcUrl;
      return this;
    }

    public com.netflix.dgs.codegen.generated.types.Blockchain.Builder explorerUrl(
        String explorerUrl) {
      this.explorerUrl = explorerUrl;
      return this;
    }

    public com.netflix.dgs.codegen.generated.types.Blockchain.Builder tokens(List<Token> tokens) {
      this.tokens = tokens;
      return this;
    }

    public com.netflix.dgs.codegen.generated.types.Blockchain.Builder games(
        List<GameContract> games) {
      this.games = games;
      return this;
    }

    public com.netflix.dgs.codegen.generated.types.Blockchain.Builder betslip(
        BetslipContract betslip) {
      this.betslip = betslip;
      return this;
    }
  }
}
