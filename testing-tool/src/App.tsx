import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useConnectWallet, useWallets } from '@web3-onboard/react'
import { ethers, providers, BigNumber, utils } from 'ethers'
import { useInterval } from 'usehooks-ts'

import { chains } from './initOnboard'
import BetSlipsAbi from './abi/BetSlipsAbi.json'
import DiceGameAbi from './abi/DiceGameAbi.json'
import AminoTokenAbi from './abi/AminoTokenAbi.json'

import type { ConnectOptions, WalletState } from '@web3-onboard/core'

const BETSLIPS_CONTRACT_ADDRESS = '0x79d965eBF8bE9Adfe1B976aAC9635164658C6d14'
const DICEGAME_CONTRACT_ADDRESS = '0x6320E63a2ca93757080F4B84Db56c5C780205116'
const USDT_CONTRACT_ADDRESS = '0xFFfffffF8d2EE523a2206206994597c13D831EC7'

let chainId : number = 0;

interface Context {
  wallet: WalletState
  betSlipsContract: ethers.Contract
  betSlipsContractSigner: ethers.Contract
  diceGameContract: ethers.Contract
  diceGameContractSigner: ethers.Contract
  USDTContract: ethers.Contract
  provider: providers.JsonRpcProvider
  walletProvider: providers.Web3Provider
}

interface Hooks {
  onBlock: (block: any) => Promise<void>
  onTokenReceived: (
    from: string,
    token: string,
    value: BigNumber
  ) => Promise<void>
  onBetSlipPlaced: (
    betId: number,
    player: string,
    tokenAddress: string,
    gameCode: string,
    playerGameChoice: string,
    wagerAmount: BigNumber,
    seedHash: string,
    odds: number,
    status: number
  ) => Promise<void>
  onBetSlipCompleted: (
    betId: number,
    player: string,
    tokenAddress: string,
    gameCode: string,
    playerGameChoice: string,
    wagerAmount: BigNumber,
    seedHash: string,
    gameResult: string,
    returnAmount: BigNumber,
    seed: string,
    odds: number,
    status: number
  ) => Promise<void>
  setUSDTBalance: (balance: BigNumber) => void
}

function initDApp(wallet: WalletState, hooks: Hooks): Context {
  let walletProvider = new ethers.providers.Web3Provider(wallet.provider)

  const matches = chains.filter((c: any) =>
    wallet.chains.some((oc) => c.id === oc.id)
  )
  let defaultUrl = matches.length > 0 ? matches[0].rpcUrl : null

  chainId = matches.length > 0 ? parseInt(matches[0].id, 16) : 0

  if (!defaultUrl) {
    throw new Error('invalid chainId')
  }

  let provider: providers.JsonRpcProvider = new providers.JsonRpcProvider(
    defaultUrl
  )
  provider.pollingInterval = 2800

  let betSlipsContract = new ethers.Contract(
    BETSLIPS_CONTRACT_ADDRESS,
    BetSlipsAbi,
    provider
  )
  let betSlipsContractSigner = new ethers.Contract(
    BETSLIPS_CONTRACT_ADDRESS,
    BetSlipsAbi,
    walletProvider.getSigner()
  )
  let diceGameContract = new ethers.Contract(
    DICEGAME_CONTRACT_ADDRESS,
    DiceGameAbi,
    provider
  )
  let diceGameContractSigner = new ethers.Contract(
    DICEGAME_CONTRACT_ADDRESS,
    DiceGameAbi,
    walletProvider.getSigner()
  )
  let USDTContract = new ethers.Contract(
    USDT_CONTRACT_ADDRESS,
    AminoTokenAbi,
    walletProvider.getSigner()
  )

  provider.on('block', hooks.onBlock)
  betSlipsContract.on('betSlipPlaced', hooks.onBetSlipPlaced)

  provider.on('block', hooks.onBlock)
  betSlipsContract.on('betSlipCompleted', hooks.onBetSlipCompleted)

  return {
    wallet,
    betSlipsContract,
    betSlipsContractSigner,
    diceGameContract,
    diceGameContractSigner,
    USDTContract,
    provider,
    walletProvider,
  }
}

function unsubscribe(context: Context) {
  context.provider.removeAllListeners()
  context.betSlipsContract.removeAllListeners()
}

interface Props {
  className?: string
}
function App({ className }: Props) {
  const [context, setContext] = useState<Context | undefined>()
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()
  // const [{ chains, connectedChain, settingChain }, setChain] = useSetChain()
  const connectedWallets = useWallets()

  const [block, setBlock] = useState<BigNumber>()
  const [tokenBalance, setTokenBalance] = useState<BigNumber>()
  const [contractTokenBalance, setContractTokenBalance] =
    useState<BigNumber>()
  const [paymentsAllowance, setPaymentsAllowance] = useState<BigNumber>()

  const [minBetLimit, setMinBetLimit] = useState(100000)
  const [maxBetLimit, setMaxBetLimit] = useState(1000000)
  const [defBetLimit, setDefBetLimit] = useState(100000)
  
  const [approveAmount, setApproveAmount] = useState(100000)
  const [withdrawAmount, setWithdrawAmount] = useState(100000)

  const [playerNumber, setPlayerNumber] = useState(42)
  const [playerChoice, setPlayerChoice] = useState("OVER")
  const [SeedHash, setSeedHash] = useState("")
  const [Seed, setSeed] = useState("")

  useEffect(() => {
    const [currentPrimary] = connectedWallets
    if (currentPrimary && currentPrimary !== context?.wallet) {
      context && unsubscribe(context)
      let newContext = initDApp(currentPrimary, {
        onBlock: async (b) => {
          setBlock(b)
        },
        onTokenReceived: async (from, token, value) => {
          let kind = token
          switch (token) {
            case USDT_CONTRACT_ADDRESS:
              kind = 'USDT'
              break
          }
          toast(
            `${value} Tokens(${kind}) received by contract from: ${from}`
          )
        },
        onBetSlipPlaced: async (betId, player, tokenAddress, gameCode, playerGameChoice, wagerAmount, seedHash, odds, status) => {
          toast(
            `ID: ${betId}, Player: ${player}, Token: ${tokenAddress}, GameCode: ${gameCode}, GameChoice: ${playerGameChoice}, wagerAmount: ${wagerAmount} SeedHash: ${seedHash}, odds: ${odds}, status: ${status}`
          )
          console.log(`ID: ${betId}, Player: ${player}, Token: ${tokenAddress}, GameCode: ${gameCode}, GameChoice: ${playerGameChoice}, wagerAmount: ${wagerAmount} SeedHash: ${seedHash}, odds: ${odds}, status: ${status}`)
        },
        onBetSlipCompleted:async (betId, player, tokenAddress, gameCode, playerGameChoice, wagerAmount, seedHash, gameResult, returnAmount, seed, odds, status) => {
          toast(
            `ID: ${betId}, Player: ${player}, Token: ${tokenAddress}, GameCode: ${gameCode}, GameChoice: ${playerGameChoice}, WagerAmount: ${wagerAmount}, SeedHash: ${seedHash}, GameResult: ${gameResult}, ReturnAmount: ${returnAmount}, Seed: ${seed}, Odds: ${odds}, status: ${status}`
          )
          console.log(`ID: ${betId}, Player: ${player}, Token: ${tokenAddress}, GameCode: ${gameCode}, GameChoice: ${playerGameChoice}, WagerAmount: ${wagerAmount}, SeedHash: ${seedHash}, GameResult: ${gameResult}, ReturnAmount: ${returnAmount}, Seed: ${seed}, Odds: ${odds}, status: ${status}`)
        },
        setUSDTBalance: setTokenBalance,
      })
      setContext(newContext)
    }
  }, [connectedWallets, context])

  const selectedAccount = wallet
    ? wallet.accounts?.length > 0
      ? wallet.accounts[0]
      : null
    : null

  useInterval(
    () => {
      if (!context || !selectedAccount) return
      context.USDTContract.balanceOf(selectedAccount?.address).then(
        setTokenBalance
      )
      context.USDTContract.balanceOf(BETSLIPS_CONTRACT_ADDRESS).then(
        setContractTokenBalance
      )
      context.USDTContract.allowance(
        selectedAccount?.address,
        BETSLIPS_CONTRACT_ADDRESS
      ).then(setPaymentsAllowance)
    },
    context ? 3000 : null
  )

  const handleSetMinBetLimitChange = (e: any) => {
    setMinBetLimit(e.target.value)
  }

  const handleSetMaxBetLimitChange = (e: any) => {
    setMaxBetLimit(e.target.value)
  }

  const handleSetDefBetLimitChange = (e: any) => {
    setDefBetLimit(e.target.value)
  }

  const handleSetApproveAmountChange = (e: any) => {
    setApproveAmount(e.target.value)
  }

  const handleSetWithdrawAmountChange = (e: any) => {
    setWithdrawAmount(e.target.value)
  }

  const handleSetPlayerNumber = (e: any) => {
    setPlayerNumber(e.target.value)
  }

  const handleSetPlayerChoice = (e: any) => {
    setPlayerChoice(e.target.value)
  }

  const handleSetSeedHash = (e: any) => {
    setSeedHash(e.target.value)
  }

  const handleSetSeed = (e: any) => {
    setSeed(e.target.value)
  }

  return (
    <div className={className}>
      <ToastContainer position="top-center" />
      <img src="logo.svg" className="logo" alt="" />

      <div className="content">
        <div className="title">Payments Contract</div>

        {!wallet ? (
          <button onClick={() => connect({} as ConnectOptions)}>
            {connecting ? 'Connecting' : 'Connect'}
          </button>
        ) : (
          <div>
            <button onClick={() => disconnect(wallet)}>
              Disconnect
            </button>
            <p>Block: {block?.toString()}</p>
            <p>My USDT BALANCE: {tokenBalance?.toString()}</p>
            <p>
              BetSlipsContract USDT BALANCE:{' '}
              {contractTokenBalance?.toString()}
            </p>
            <p>
              BetSlipsContract USDT ALLOWANCE:{' '}
              {paymentsAllowance?.toString()}
            </p>
          </div>
        )}

        {wallet && (
          <div>
            <button
              onClick={async () => {
                context!.diceGameContractSigner.setBetLimit(
                  USDT_CONTRACT_ADDRESS,
                  BigNumber.from(minBetLimit),
                  BigNumber.from(maxBetLimit),
                  BigNumber.from(defBetLimit)
                )
              }}
            >
              Add BetLimit
            </button>
            <button
              onClick={async () => {
                context!.USDTContract.approve(
                  BETSLIPS_CONTRACT_ADDRESS,
                  BigNumber.from(approveAmount),
                  { gasLimit: 150000 }
                )
                // context!.USDTContract.transfer(
                //   BETSLIPS_CONTRACT_ADDRESS,
                //   BigNumber.from(approveAmount)
                // )
              }}
            >
              Approve
            </button>
            <button
              onClick={async () => {
                context!.diceGameContractSigner.placeBet(
                  BigNumber.from(approveAmount),
                  playerNumber,
                  playerChoice,
                  SeedHash,
                  USDT_CONTRACT_ADDRESS
                )
              }}
            >
              PlaceBet
            </button>

            <button
              onClick={async () => {
                context!.diceGameContractSigner.revealSeed(
                  SeedHash,
                  Seed
                )
              }}
            >
              revealSeed
            </button>

            <button
              onClick={() => {
                context &&
                  placeBetWithPermit(
                    BigNumber.from(approveAmount),
                    playerNumber,
                    playerChoice,
                    SeedHash,
                    context,
                    wallet!,
                    selectedAccount?.address
                  )
              }}
            >
              PlaceBet With Permit
            </button>

            <button
              onClick={async () => {
                context!.betSlipsContractSigner.withdrawERC20(
                  USDT_CONTRACT_ADDRESS,
                  BigNumber.from(withdrawAmount)
                )
              }}
            >
              Withdraw Token
            </button>

            <button
              onClick={async () => {
                const betslip = await context!.betSlipsContractSigner.getBetSlip(
                  "f280ae314b70448009bb097d9c61362d1e5120efbd0609a9a67be75b54850176"
                )
                console.log("++++++", betslip)
              }}
            >
              Get BetSlip
            </button>

          </div>
        )}

        {connectedWallets.map(({ label, accounts }) => {
          return (
            <div key={label}>
              <div>{label}</div>
              <div>
                Accounts: {JSON.stringify(accounts, null, 2)}
              </div>
            </div>
          )
        })}

        {wallet && (
          <div className="content-div">
            <div className="content-div1">
              <div className="content-input">
                <label>Minimum BetLimit: </label> <input className='inputBox' value={minBetLimit} onChange={(e) => handleSetMinBetLimitChange(e)} />
              </div>
              <div className="content-input">
                <label>Maximum BetLimit: </label> <input className='inputBox' value={maxBetLimit} onChange={(e) => handleSetMaxBetLimitChange(e)} />
              </div>
              <div className="content-input">
                <label>Default BetLimit: </label> <input className='inputBox' value={defBetLimit} onChange={(e) => handleSetDefBetLimitChange(e)} />
              </div>
            </div>
            <div className="content-div2">
              <div className="content-input">
                <label>Approve Amount: </label> <input className='inputBox' value={approveAmount} onChange={(e) => handleSetApproveAmountChange(e)} />
              </div>
              <div className="content-input">
                <label>Withdraw Amount: </label> <input className='inputBox' value={withdrawAmount} onChange={(e) => handleSetWithdrawAmountChange(e)} />
              </div>
            </div>
            <div className="content-div2">
              <div className="content-input">
                <label>Player Number: </label> <input className='inputBox' value={playerNumber} onChange={(e) => handleSetPlayerNumber(e)} />
              </div>
              <div className="content-input">
                <label>Player Choice: </label> <input className='inputBox' value={playerChoice} onChange={(e) => handleSetPlayerChoice(e)} />
              </div>
              <div className="content-input">
                <label>SeedHash: </label> <input className='inputBox' value={SeedHash} onChange={(e) => handleSetSeedHash(e)} />
              </div>
              <div className="content-input">
                <label>Seed: </label> <input className='inputBox' value={Seed} onChange={(e) => handleSetSeed(e)} />
              </div>
            </div>
        </div>
        )}

      </div>
    </div>
  )
}

async function placeBetWithPermit(
  wagerAmount: BigNumber,
  playerNumber: number,
  choice: string,
  seedHash: string,
  context: Context,
  wallet: WalletState,
  address?: string,
) {
  if (!context || !address) return

  let name = await context.USDTContract.name()
  let verifyingContract = context.USDTContract.address.toLowerCase()

  let allowance = wagerAmount.toString()
  let nonce = (await context.USDTContract.nonces(address)).toString()
  let deadline = BigNumber.from(
    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
  ).toString()

  console.log(name, nonce.toString())
  console.log(wallet)

  let domain = {
    name,
    version: '1',
    chainId: chainId,
    verifyingContract,
  }
  let permit = {
    owner: address,
    spender: BETSLIPS_CONTRACT_ADDRESS,
    value: allowance,
    nonce,
    deadline,
  }

  try {
    const signature = await context.walletProvider.send(
      'eth_signTypedData_v4',
      [address, JSON.stringify(CreateEIP2612Permit(domain, permit))]
    )
    let sig = utils.splitSignature(signature)

    context.diceGameContractSigner.placeBetWithPermit(
      wagerAmount,
      playerNumber,
      choice,
      seedHash,
      USDT_CONTRACT_ADDRESS,
      deadline,
      sig.v,
      sig.r,
      sig.s
    )
  } catch (e) {
    console.log(e)
  }
}

function CreateEIP2612Permit(
  domain: {
    name: string
    version: string
    chainId: number
    verifyingContract: string
  },
  message: {
    owner: string
    spender: string
    value: string
    nonce: string
    deadline: string
  }
): any {
  console.log(
    `EIP2612 Domain
		Name: ${domain.name}
		Verifying Contract: ${domain.verifyingContract}
		Version: ${domain.version}
		ChainId: ${domain.chainId}

		Message
		Owner: ${message.owner}
		Spender: ${message.spender}
		Value: ${message.value}
		Nonce: ${message.nonce}
		Deadline: ${message.deadline}`
  )

  return {
    domain,
    primaryType: 'Permit',
    message,
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
  }
}

export default styled(App)`
  .logo {
    margin-left: 24px;
    width: 200px;
  }

  .content {
    text-align: center;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 0;
    right: 0;
  }

  .title {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 700;
    font-size: 60px;
    line-height: 73px;
    margin: 34px 0;
  }

  .form {
    display: flex;
    justify-content: center;

    .textfield {
      width: 400px;
      height: 40px;
      text-indent: 20px;

      border: 2px solid black;
      border-radius: 10px 0 0 10px;
    }

    .dropdown {
      font-size: 16px;
      line-height: 40px;
      border: 2px solid black;
      border-left: none;
      border-radius: 0 10px 10px 0;
      background-color: #6982de;
      color: white;
      cursor: pointer;
    }
  }

  .submitBtn {
    background: linear-gradient(98.29deg, #2b7fff 10.91%, #12299e 100%);
    box-shadow: 4px 4px 20px rgba(0, 0, 0, 0.1);
    border-radius: 300px;

    padding: 8px 32px;
    margin-left: 30px;

    color: white;
    box-shadow: none;
    border: none;
    cursor: pointer;

    font-size: 16px;
  }

  .inputBox {
    margin-left: auto;
    width: 50%;
  }

  .content-input{
    border: 1px solid rgb(111,41,97);
    border-radius: .3em;
    padding: 5px;
    display: flex;
    margin: 1em;
  }

  .content-div{
    padding: 15px;
    display: flex;
    height: 200px;
    // background-color: darkgray;
  }

  .content-div1{
    border: 1px solid rgb(10,41,97);
    border-radius: .3em;
    padding: 5px;
    height: 210px;
    width: 23%;
    background-color: powderblue;
    margin-left: 12%;
  }

  .content-div2{
    border: 1px solid rgb(10,41,97);
    border-radius: .3em;
    padding: 5px;
    height: 210px;
    width: 23%;
    background-color: powderblue;
    margin-left: 2%;
  }

  :root {
    /* CUSTOMIZE THE COLOR  PALLETTE */
    --onboard-white: white;
    --onboard-black: black;
    --onboard-primary-1: #2f80ed;
    --onboard-primary-100: #eff1fc;
    --onboard-primary-200: #d0d4f7;
    --onboard-primary-300: #b1b8f2;
    --onboard-primary-400: #929bed;
    --onboard-primary-500: #6370e5;
    --onboard-primary-600: #454ea0;
    --onboard-primary-700: #323873;
    --onboard-gray-100: #ebebed;
    --onboard-gray-200: #c2c4c9;
    --onboard-gray-300: #999ca5;
    --onboard-gray-400: #707481;
    --onboard-gray-500: #33394b;
    --onboard-gray-600: #242835;
    --onboard-gray-700: #1a1d26;
    --onboard-success-100: #d1fae3;
    --onboard-success-200: #baf7d5;
    --onboard-success-300: #a4f4c6;
    --onboard-success-400: #8df2b8;
    --onboard-success-500: #5aec99;
    --onboard-success-600: #18ce66;
    --onboard-success-700: #129b4d;
    --onboard-danger-100: #ffe5e6;
    --onboard-danger-200: #ffcccc;
    --onboard-danger-300: #ffb3b3;
    --onboard-danger-400: #ff8080;
    --onboard-danger-500: #ff4f4f;
    --onboard-danger-600: #cc0000;
    --onboard-danger-700: #660000;
    --onboard-warning-100: #ffefcc;
    --onboard-warning-200: #ffe7b3;
    --onboard-warning-300: #ffd780;
    --onboard-warning-400: #ffc74c;
    --onboard-warning-500: #ffaf00;
    --onboard-warning-600: #cc8c00;
    --onboard-warning-700: #664600;
    --onboard-font-size-1: 3rem;
    --onboard-font-size-2: 2.25rem;
    --onboard-font-size-3: 1.5rem;
    --onboard-font-size-4: 1.25rem;
    --onboard-font-size-5: 1rem;
    --onboard-font-size-6: 0.875rem;
    --onboard-font-size-7: 0.75rem;

    /* SPACING */
    --onboard-spacing-1: 3rem;
    --onboard-spacing-2: 2rem;
    --onboard-spacing-3: 1.5rem;
    --onboard-spacing-4: 1rem;
    --onboard-spacing-5: 0.5rem;

    /* SHADOWS */
    --onboard-shadow-1: 0px 4px 12px rgba(0, 0, 0, 0.1);
    --onboard-shadow-2: inset 0px -1px 0px rgba(0, 0, 0, 0.1);
  }
`

