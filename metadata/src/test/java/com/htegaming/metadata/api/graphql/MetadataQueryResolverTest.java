package com.htegaming.metadata.api.graphql;

import com.htegaming.metadata.api.helper.MetadataApiClient;
import com.netflix.dgs.codegen.generated.types.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class MetadataQueryResolverTest {

    private static final String ID = "13370";
    private static final String CODE = "aminox";
    private static final String NAME = "Amino X Testnet";
    private static final String RCP_URL = "https://aminoxtestnet.node.alphacarbon.network";
    private static final String EXPLORER_URL = "https://aminoxtestnet.blockscout.alphacarbon.network";
    private static final String USDT_TOKEN_SYMBOL = "USDT";
    private static final int USDT_TOKEN_DIGITS = 6;
    private static final String USDT_TOKEN_ADDRESS = "1461501637178285191838872753765962265701325676231";
    private static final String DICE_GAME_NAME = "dice";
    private static final String DICE_GAME_ADDRESS = "356404745141380203587330499414716969734871142977";
    private static final String MINES_GAME_NAME = "mines";
    private static final String MINES_GAME_ADDRESS = "854461334427174448340261949816033718157124411724";
    private static final String BET_SLIP_ADDRESS = "188857502803627581125145266683897948125303230323";
    @Autowired
    private MetadataApiClient metadataApiClient;

    @Test
    @DisplayName("Should return blockchain metadata")
    public void testGettingBlockchainMetadata(){
        Blockchain blockchain = metadataApiClient.getBlockchainMetadata(CODE).get(0);

        Token usdtToken = blockchain.getTokens().stream().filter(token -> token.getSymbol().equals(USDT_TOKEN_SYMBOL)).findAny().orElseThrow();
        GameContract diceGame = blockchain.getGames().stream().filter(gameContract -> gameContract.getName().equals(DICE_GAME_NAME)).findAny().orElseThrow();
        GameContract minesGame = blockchain.getGames().stream().filter(gameContract -> gameContract.getName().equals(MINES_GAME_NAME)).findAny().orElseThrow();
        BetslipContract betSlip = blockchain.getBetslip();

        assertThat(blockchain.getId()).isEqualTo(ID);
        assertThat(blockchain.getCode()).isEqualTo(CODE);
        assertThat(blockchain.getName()).isEqualTo(NAME);
        assertThat(blockchain.getRpcUrl()).isEqualTo(RCP_URL);
        assertThat(blockchain.getExplorerUrl()).isEqualTo(EXPLORER_URL);
        assertThat(usdtToken.getDigits()).isEqualTo(USDT_TOKEN_DIGITS);
        assertThat(usdtToken.getType()).isEqualTo(TokenType.ERC20);
        assertThat(usdtToken.getAddress()).isEqualTo(USDT_TOKEN_ADDRESS);
        assertThat(usdtToken.getAbi()).isNotBlank();
        assertThat(diceGame.getAddress()).isEqualTo(DICE_GAME_ADDRESS);
        assertThat(diceGame.getAbi()).isNotBlank();
        assertThat(minesGame.getAddress()).isEqualTo(MINES_GAME_ADDRESS);
        assertThat(minesGame.getAbi()).isNotBlank();
        assertThat(betSlip.getAddress()).isEqualTo(BET_SLIP_ADDRESS);
        assertThat(betSlip.getAbi()).isNotBlank();
    }

}
