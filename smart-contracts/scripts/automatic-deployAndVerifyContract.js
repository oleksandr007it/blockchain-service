const { exec } = require('child_process');
const { program } = require('commander');
const util = require('util');
const path = require('path');
const fs = require('fs');
const execProm = util.promisify(exec);

const aminoxDomainURL = 'https://aminoxtestnet.blockscout.alphacarbon.network';
const deployScriptPath = '../scripts/deploy-gameRegularContracts.js';
const configScriptPath = '../cache/deploy_config.json';
const argumentFilePath = '../scripts/arguments.js';
const flattenDir = '../artifacts/flatten';
const addressLength = 42;


var contractsDir;
var contractName;
var rtpValue;
var minBetLimit;
var maxBetLimit;
var defBetLimit;
var argument_blockchain;
var metadata;

var libraryAddress;
var contractAddress;
var flattenFilesPath;


function readdirAsync(path) {
  return new Promise(function (resolve, reject) {
    fs.readdir(path, function (error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

// Parse command arguments
async function parseArguments() {
  program.version('0.1.0', '-v, --vers', 'output the current version');

  program
  .requiredOption('-f, --contract [value]', 'Input file name of game contract. ex: DiceGame')
  .requiredOption('-n, --blockchain [value]', 'Input blockchain name. ex: aminxtestnet', 'aminxtestnet')
  .option('-r, --rtp [number]', 'Input rtp value', 97)
  .option('-l, --betlimit [number...]', 'Input amounts of betlimits(min, max, def)', ['2000000', '10000000000', '32000000'])
  .option('-m, --metadata [value]', 'Input blockchain code', 'aminox');

  program.parse();

  const options = program.opts();

  if (options.contract == "BetSlips") {                                               // in case of deploying BetSlips contract
    contractName = 'BetSlips';
    contractsDir = '../contracts/betslip';
  } else {                                                                            // in case of deploying normal game contract
    contractsDir = '../contracts/games';
    files = await readdirAsync(path.join(__dirname, contractsDir));

    for (let fileName of files) {
      // find the game contract file. ex: Assume that file name is "DiceGame.sol", contract file name should includes it. So, the result is "DiceGame" 
      if (fileName.indexOf(options.contract) != -1) {
        contractName = fileName.substring(0, fileName.length-4);
      }
    }

    if (contractName) {
      options.contract = contractName;
    } else {
      console.log("Please input game name correctly!");
      process.exit();
    }
  }
    // check blockchain name
  if (options.blockchain != "aminxtestnet" && options.blockchain != "bscTestnet" && options.blockchain != "polygonMumbai") {
    console.log("Please input the name of blockchain network correctly!");
    process.exit();
  }

  rtpValue = options.rtp;
  minBetLimit = options.betlimit[0];
  maxBetLimit = options.betlimit[1];
  defBetLimit = options.betlimit[2];
  argument_blockchain = options.blockchain;
  metadata = options.metadata;

  console.log('Contract Name: ', contractName);
  console.log('rtp value: ', rtpValue);
  console.log('Minimum Betlimits: ', minBetLimit);
  console.log('Maximum Betlimits: ', maxBetLimit);
  console.log('Default Betlimits: ', defBetLimit);
  console.log('Blockchain: ', argument_blockchain);

  const configFilePath = path.join(__dirname, configScriptPath);

  let data;
  let jsonString;
  let configJsonData;
  if (!fs.existsSync(configFilePath)) {                                 // when there's no deploy_config.json, it was created and initialized
    configJsonData = {};
    configJsonData.aminxtestnet = {};
    configJsonData.bscTestnet = {};
    configJsonData.polygonMumbai = {};

    data = JSON.stringify(configJsonData);
    await fs.writeFileSync(configFilePath, data);
  }

  jsonString = fs.readFileSync(configFilePath);
  configJsonData = JSON.parse(jsonString);

  configJsonData.blockchain = argument_blockchain;
  configJsonData[argument_blockchain].contract = contractName;
  configJsonData[argument_blockchain].rtpValue = rtpValue;
  configJsonData[argument_blockchain].minBetLimit = minBetLimit;
  configJsonData[argument_blockchain].maxBetLimit = maxBetLimit;
  configJsonData[argument_blockchain].defBetLimit = defBetLimit;
  configJsonData[argument_blockchain].metadata = metadata;
  
  data = JSON.stringify(configJsonData);
  await fs.writeFileSync(configFilePath, data);
}

function getGameConfig(gameCode) {
  return {
      rtp: 97,
      betlimits: [2000000, 10000000000, 32000000],
      enabled: true
  }
}

async function getMetadata(blockchainCode) {
  try {
    const url = endpoint + `/api/blockchains/${blockchainCode}/metadata`;
    const curlData = `curl ${url}`;
    result = await execProm(curlData);
  } catch(ex) {
    result = ex;
  }

  return result;
}

// Deploy the contract.
async function runDeploy() {
  const scriptPath = path.join(__dirname, deployScriptPath);

  try {
    result = await execProm(`npx hardhat run ${scriptPath} --network ${argument_blockchain}`);
  } catch(ex) {
    result = ex;
  }
  
  const matches = [...result.stdout.matchAll(/0x/g)];
  const indexes = matches.map(match => match.index);
  
  if (indexes.length == 2) {                                                            // in case that BetSlips contract is deployed
    libraryAddress = result.stdout.substring(indexes[0], indexes[0] + addressLength);
    contractAddress = result.stdout.substring(indexes[1], indexes[1] + addressLength);   
    try {                                                                               // update deploy_config.json file
      const configFilePath = path.join(__dirname, configScriptPath);
      const jsonString = fs.readFileSync(configFilePath);
      const configData = JSON.parse(jsonString);
      configData[argument_blockchain].betSlipsAddress = contractAddress;
    
      const data = JSON.stringify(configData);
      fs.existsSync(configFilePath);
      await fs.writeFileSync(configFilePath, data);
    } catch (err) {
      console.log(err);
      return;
    }

    console.log(result.stdout);
    return true;
  } else if (indexes.length == 3) {                                                       // in case that game contract is deployed
    libraryAddress = result.stdout.substring(indexes[0], indexes[0] + addressLength);
    contractAddress = result.stdout.substring(indexes[2], indexes[2] + addressLength);

    console.log(result.stdout);
    return true;
  } else {
    console.log(result.stderr);
    console.log("Fail to deploy the contract");
    return false;
  }
}

// Flatten the source code of contract.
async function runFlatten() {
  const fileName = contractName + '.sol';
  const contractFilePath = path.join(__dirname, contractsDir, fileName);
  const flattenFileName = "flatten_" + fileName;                                          // ex:flatten_DiceGame.sol
  flattenFilesPath = path.join(__dirname, flattenDir, flattenFileName);
  
  if (!fs.existsSync(path.join(__dirname, flattenDir))){
    fs.mkdirSync(path.join(__dirname, flattenDir));
  }
  
  await execProm(`npx hardhat flatten ${contractFilePath} > ${flattenFilesPath}`);

  let file = fs.readFileSync(`${flattenFilesPath}`, "utf8");
  let dataArray = file.split(/\r?\n/);
  let firstFlag = false;

  //Remove all of the "SPDX-License-Identifier: MIT" except first case in the flatten_<contractName>.sol
  for (let i = 0; i < dataArray.length; i++) {
    if (dataArray[i].includes("SPDX-License-Identifier: MIT")) {
      if (!firstFlag) {
        firstFlag = true;
      } else {
        dataArray.splice(i, 1);
      }
    }
  }

  const updatedData = dataArray.join('\r\n');
  await fs.writeFile(`${flattenFilesPath}`, updatedData, (err) => {
    if (err) throw err;
    console.log("Successfully output flatten file!");
  });
}

function fixedEncodeURIComponent(str) {
  return encodeURIComponent(str).replace(/[!'()]/g, function(c) {       
    return '%' + c.charCodeAt(0).toString(16).toUpperCase(); 
  }).replace(/%20/g, '+');            // ' ' -> %20 -> '+'
}

async function makeCommandData(cookieData, csrfToken) {
  async function readFlattenFile() {
    const data = await fs.promises.readFile(`${flattenFilesPath}`, "binary");
    
    return fixedEncodeURIComponent(data);
  }
  let flattenFileData = await readFlattenFile();

  const url = aminoxDomainURL + '/verify_smart_contract/contract_verifications';
  const curlData = `curl -# '${url}' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -H 'cookie: _explorer_key=${cookieData}' \
  --data-raw '_csrf_token=${csrfToken}&smart_contract%5Baddress_hash%5D=${contractAddress}&smart_contract%5Bname%5D=${contractName}&smart_contract%5Bnightly_builds%5D=false&smart_contract%5Bcompiler_version%5D=v0.8.4%2Bcommit.c7e474f2&smart_contract%5Bevm_version%5D=default&smart_contract%5Boptimization%5D=true&smart_contract%5Boptimization_runs%5D=50&smart_contract%5Bcontract_source_code%5D=${flattenFileData}&smart_contract%5Bautodetect_constructor_args%5D=true&smart_contract%5Bconstructor_arguments%5D=&external_libraries%5Blibrary1_name%5D=SeedUtility&external_libraries%5Blibrary1_address%5D=${libraryAddress}&external_libraries%5Blibrary2_name%5D=&external_libraries%5Blibrary2_address%5D=&external_libraries%5Blibrary3_name%5D=&external_libraries%5Blibrary3_address%5D=&external_libraries%5Blibrary4_name%5D=&external_libraries%5Blibrary4_address%5D=&external_libraries%5Blibrary5_name%5D=&external_libraries%5Blibrary5_address%5D=' \
  --compressed`;

  return curlData;
}

//Verify the contract.
async function runVerify() {
  if (argument_blockchain == "aminxtestnet") {
    let url = 'curl -i ' + aminoxDomainURL + '/address/' + contractAddress + '/contract_verifications/new';
    let result = await execProm(url);
    const cookieData = result.stdout.match(/_explorer_key=([^;]+)/g)[0].replace('_explorer_key=', '');
    console.log("Cookie: ", cookieData);
    const csrfToken = result.stdout.match(/<input name="_csrf_token(.*)?>/g)[0].match(/value="(.*)?"/g)[0].replace(/value=|"/g, '');
    console.log("CSRF Token: ",csrfToken);
    console.log(`Successfully get the cookie and token!`);

    const cmdPromise = makeCommandData(cookieData, csrfToken);                            // Make the curl command
    cmdPromise.then((cmd) => {
      try {
        result = execProm(cmd);                                                           // run curl 
      } catch(ex) {
        result = ex;
      }
      console.log("Successfully verify the contract!")
    });
  } else if (argument_blockchain == "bscTestnet" || argument_blockchain == "polygonMumbai") {
    const configFilePath = path.join(__dirname, configScriptPath);                        // read BetSlips address from deploy_config.json
    const jsonString = fs.readFileSync(configFilePath);
    const configData = JSON.parse(jsonString);
    const betSlipsAddress = configData[argument_blockchain].betSlipsAddress;

    let argumentsPath = path.join(__dirname, argumentFilePath);
    try {
      if (!fs.existsSync(argumentsPath)) {                                                // create arguments.js if it doesn't exist
        const argumentsData = `module\.exports = \["${betSlipsAddress}", ${rtpValue}\]`;
        await fs.writeFileSync(argumentsPath, argumentsData);
      }

      fs.readFile(`${argumentsPath}`,  function read(err, data) {                         // update arguments.js file with BetSlips address
        if (err) {
          throw err;
        }
        let file_content = data.toString();
        let idx = file_content.indexOf('"0x');
        let updateString = file_content.slice(0, idx+1) + betSlipsAddress + file_content.slice(idx+addressLength+1);   // change the BetSlips address
        fs.writeFile(`${argumentsPath}`, updateString, 'utf8', function (err) {
          if (err) return console.log(err);
        });
      });

      if (contractName == "BetSlips") {
        result = await execProm(`npx hardhat verify --network ${argument_blockchain} ${betSlipsAddress}`);  
      } else {
        result = await execProm(`npx hardhat verify --constructor-args ${argumentsPath} --network ${argument_blockchain} ${contractAddress}`);
      }
    } catch(ex) {
      result = ex;
    }
    console.log(result.stdout);
  }
}

//Update Aws config
async function updateAWSParamStore() {
  require('./.env');
  const userName = process.env.username;
  const password = encodeURIComponent(process.env.password).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  const fileName = 'application.yml';
  const yamlDir = path.join(__dirname, './htegaming-config/');
  const yamlFilePath = path.join(yamlDir, fileName);

  await execProm(`git -C ${__dirname} clone https://${userName}:${password}@gitlab.htecoins.com/ac-gaming-platform-backend/htegaming-config.git`);
  await execProm(`cd ${yamlDir} && git checkout parameters && git reset HEAD~1`);
  const commitText = await updateYamlFile(yamlFilePath);
  await execProm(`cd ${yamlDir} && git add "${fileName}" && git commit -m "${commitText}" && git push -f`);
  await execProm(`rm -rf ${yamlDir}`);
}

async function updateYamlFile(yamlFilePath) {
  let result;

  let file = fs.readFileSync(`${yamlFilePath}`, "utf8");
  let dataArray = file.split(/\r?\n/);
  let findGamesItem = false;
  let gameName = contractName.replace("Game", '').toLowerCase();                // "StairsGame" -> "stairs"

  for (let i = 0; i < dataArray.length; i++) {
    if (dataArray[i]==="games:") {                                              // find "games:" item
      findGamesItem = true;
      continue;
    }

    if (findGamesItem) {
      if (dataArray[i].includes(gameName)) {                                    // update the address of game contract, if it already exists.
        dataArray.splice(i+2, 1, ("    " + 'address: ' + contractAddress));
        result = "updated " + contractName;
        break;
      }

      if (dataArray[i+1]==='logging:') {                                        // add the content of new game contract, if it doesn't exist.
        dataArray.splice(i+1, 0, ("  " + gameName + ':'));
        dataArray.splice(i+2, 0, ("    " + "abi: " + contractName + "Abi.json"));
        dataArray.splice(i+3, 0, ("    " + "address: " + contractAddress));
        result = "added " + contractName;
        break;
      }
    }
  }

  const updatedData = dataArray.join('\r\n');
  await fs.writeFile(`${yamlFilePath}`, updatedData, (err) => {
    if (err) throw err;
    console.log("Successfully update yaml file!");
  });

  return result;
}

async function main() {
  await parseArguments();
  
  const result = await runDeploy();
  if (result) {
    if (argument_blockchain == "aminxtestnet") {
      await runFlatten();
    }
    await runVerify();
    if (argument_blockchain == "aminxtestnet" && contractName != "BetSlips") {
      await updateAWSParamStore();
    }
  }
}

main();