package com.netflix.dgs.codegen.generated.types;

import java.lang.Object;
import java.lang.Override;
import java.lang.String;

public class Token {
  private String symbol;

  private int digits;

  private TokenType type;

  private String address;

  private String abi;

  public Token() {
  }

  public Token(String symbol, int digits, TokenType type, String address, String abi) {
    this.symbol = symbol;
    this.digits = digits;
    this.type = type;
    this.address = address;
    this.abi = abi;
  }

  public String getSymbol() {
    return symbol;
  }

  public void setSymbol(String symbol) {
    this.symbol = symbol;
  }

  public int getDigits() {
    return digits;
  }

  public void setDigits(int digits) {
    this.digits = digits;
  }

  public TokenType getType() {
    return type;
  }

  public void setType(TokenType type) {
    this.type = type;
  }

  public String getAddress() {
    return address;
  }

  public void setAddress(String address) {
    this.address = address;
  }

  public String getAbi() {
    return abi;
  }

  public void setAbi(String abi) {
    this.abi = abi;
  }

  @Override
  public String toString() {
    return "Token{" + "symbol='" + symbol + "'," +"digits='" + digits + "'," +"type='" + type + "'," +"address='" + address + "'," +"abi='" + abi + "'" +"}";
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Token that = (Token) o;
        return java.util.Objects.equals(symbol, that.symbol) &&
                            digits == that.digits &&
                            java.util.Objects.equals(type, that.type) &&
                            java.util.Objects.equals(address, that.address) &&
                            java.util.Objects.equals(abi, that.abi);
  }

  @Override
  public int hashCode() {
    return java.util.Objects.hash(symbol, digits, type, address, abi);
  }

  public static com.netflix.dgs.codegen.generated.types.Token.Builder newBuilder() {
    return new Builder();
  }

  public static class Builder {
    private String symbol;

    private int digits;

    private TokenType type;

    private String address;

    private String abi;

    public Token build() {
                  com.netflix.dgs.codegen.generated.types.Token result = new com.netflix.dgs.codegen.generated.types.Token();
                      result.symbol = this.symbol;
          result.digits = this.digits;
          result.type = this.type;
          result.address = this.address;
          result.abi = this.abi;
                      return result;
    }

    public com.netflix.dgs.codegen.generated.types.Token.Builder symbol(String symbol) {
      this.symbol = symbol;
      return this;
    }

    public com.netflix.dgs.codegen.generated.types.Token.Builder digits(int digits) {
      this.digits = digits;
      return this;
    }

    public com.netflix.dgs.codegen.generated.types.Token.Builder type(TokenType type) {
      this.type = type;
      return this;
    }

    public com.netflix.dgs.codegen.generated.types.Token.Builder address(String address) {
      this.address = address;
      return this;
    }

    public com.netflix.dgs.codegen.generated.types.Token.Builder abi(String abi) {
      this.abi = abi;
      return this;
    }
  }
}
