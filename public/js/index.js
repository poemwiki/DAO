var pagination = 10;
var proposalOffset = 0;
var uploadBatchMintData = [];
var web3;
var TYPEING_ID;
const ETHERSCAN_URL = "https://polygonscan.com/"; // Rinkeby: https://rinkeby.etherscan.io/
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const CHAIN_NAME = "Polygon Mainnet"; // Polygon Mainnet, Rinkeby
const CHAIN_ID = 137; // Polygon: 137, Rinkeby: 4, Goerli: 5
const NATIVE_CURRENCY = "MATIC"; // Polygon: MATIC, Rinkeby: RIN
const RPC_URLS = ["https://rpc-mainnet.matic.quiknode.pro"]; // Polygon: ['https://rpc-mainnet.matic.quiknode.pro'], Rinkeby: ['https://rpc.ankr.com/eth_rinkeby']

// production env addresses
const TOKEN_ADDRESS = "0x023D7505B15f15e1D33b77C171F870fD5445F35A";
const GOVERNOR_ADDRESS = "0x8650Ce5eB77DD43629c9EAaf461F339A4FC90402";

// const TOKEN_ADDRESS = '0x7659f27043FA6b98FE91Ddd39CfAFa78613e1fAf'
const TOKEN_SYMBOL = "PWR";
const TOKEN_DECIMALS = 18;
// const GOVERNOR_ADDRESS = '0x55d9A177EabD0F7024Bce9DaFED16549B8690e6e'
const SERVER_URL = window.location.origin;
const GOVERNOR_TYPE = "NoTLGovernor";

function governorAbi() {
  if (GOVERNOR_TYPE === "NoTLGovernor") {
    return withoutTLGovernorAbi();
  }
  return withTLGovernorAbi();
}

console.log("TOKEN_ADDRESS:", TOKEN_ADDRESS);
console.log("GOVERNOR_ADDRESS:", GOVERNOR_ADDRESS);
console.log("SERVER_URL:", SERVER_URL);
done();

var g_holders;

async function getHolders() {
  const ret = await fetch(`${SERVER_URL}/api/holder/all`, {
    method: "POST",
  });
  const data = await ret.json();
  return data.data;
}

async function getBlockAverageTime(span) {
  running();
  web3 = new Web3(window.ethereum);
  const times = [];
  const currentNumber = await web3.eth.getBlockNumber();
  const firstBlock = await web3.eth.getBlock(currentNumber - span);
  let prevTimestamp = firstBlock.timestamp;

  for (let i = currentNumber - span + 1; i <= currentNumber; i++) {
    const block = await web3.eth.getBlock(i);
    let time = block.timestamp - prevTimestamp;
    prevTimestamp = block.timestamp;
    times.push(time);
  }
  done();
  return Math.round(times.reduce((a, b) => a + b) / times.length);
}

async function switchNetworkCheck() {
  running();
  web3 = new Web3(window.ethereum);
  if (window.ethereum !== CHAIN_ID) {
    try {
      const results = await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: web3.utils.toHex(CHAIN_ID) }],
      });
    } catch (err) {
      // This error code indicates that the chain has not been added to MetaMask
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainName: CHAIN_NAME,
              chainId: web3.utils.toHex(CHAIN_ID),
              nativeCurrency: {
                name: NATIVE_CURRENCY,
                decimals: 18,
                symbol: NATIVE_CURRENCY,
              },
              rpcUrls: RPC_URLS,
            },
          ],
        });
      }
    }
  }
  done();
}

function done() {
  clearInterval(TYPEING_ID);
  TYPEING_ID = setInterval(() => {
    var typing = document.getElementById("typing");
    if (typing.innerHTML === "_") {
      typing.innerHTML = "\n";
    } else {
      typing.innerHTML = "";
    }
  }, 1000);
}

function running() {
  clearInterval(TYPEING_ID);
  TYPEING_ID = setInterval(() => {
    var typing = document.getElementById("typing");
    if (typing.innerHTML === "Loading\\\n") {
      typing.innerHTML = "Loading|\n";
    } else if (typing.innerHTML === "Loading|\n") {
      typing.innerHTML = "Loading/\n";
    } else if (typing.innerHTML === "Loading/\n") {
      typing.innerHTML = "Loading-\n";
    } else if (typing.innerHTML === "Loading-\n") {
      typing.innerHTML = "Loading\\\n";
    } else {
      typing.innerHTML = "Loading\\\n";
    }
  }, 200);
}

function printErrorLog(error, elementId) {
  running();
  if (error) {
    console.error(error);
    var log = document.getElementById(elementId);
    if (
      error.message.indexOf(
        "execution reverted: Governor: proposer votes below proposal threshold"
      ) !== -1
    ) {
      log.innerHTML =
        '<p>提案失败！您的积分低于最低提案门槛，详细请见 "治理参数"</p><br/>';
    } else if (error.message.indexOf("invalid address") !== -1) {
      log.innerHTML = "<p>地址有误，请检查你的发放地址</p><br/>";
    } else if (
      error.message.indexOf(
        "while converting number to string, invalid number"
      ) !== -1
    ) {
      log.innerHTML = "<p>数量有误，请检查你的发放数量</p><br/>";
    } else {
      log.innerHTML = "<p>" + JSON.stringify(error.message) + "</p><br/>";
    }
    log.style.color = "red";
    initCreateProposal(false);
    initCreateBatchMintProposal(false);
  }
  done();
}

function csvToArray(str, delimiter = ",") {
  const headers = str.slice(0, str.indexOf("\n")).split(delimiter);
  const rows = str.slice(str.indexOf("\n") + 1).split("\n");
  const arr = rows.map(function (row) {
    const values = row.split(delimiter);
    const el = headers.reduce(function (object, header, index) {
      object[
        String(header)
          .replace(/\s/g, "")
          .replace(/(\r\n|\n|\r)/gm, "")
      ] = String(values[index])
        .replace(/\s/g, "")
        .replace(/(\r\n|\n|\r)/gm, "");
      return object;
    }, {});
    return el;
  });
  return arr;
}

function uploadBatchMintFile() {
  var file = document.getElementById("createBatchMintProposalFile").files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const batch = csvToArray(text);
    var csvpreview = document.getElementById("csvpreview");
    let count = 0;
    csvpreview.innerHTML =
      "&nbsp;&nbsp;<small>地址 (address)" +
      "&nbsp;".repeat(29) +
      "&nbsp;數量 (amont)</small><br/>";
    uploadBatchMintData = [];
    batch.forEach((b) => {
      if (Number(b.amount) > 0 && b.address.length === 42) {
        uploadBatchMintData.unshift(b);
        count += 1;
        csvpreview.innerHTML += `<small>${count}. ${b.address}, ${b.amount}</small><br/>`;
      }
    });
    if (count === 0) {
      csvpreview.innerHTML =
        '<font size="4" color="red">档案有问题，請檢查檔案後再試一次！或参考范例：</font><br/>';
      csvpreview.innerHTML +=
        '<font size="4"><a style="color:#59bfcf;" href="data:application/octet-stream,address%2Camount%0A0x490ee9a3dfe5fa4c65a4a65b3fe178a3c12398a6%2C100%0A0xa672f027765d044ea786149c86daef1c0344f901%2C50%0A" download="batchmint.csv">范例档案</a></font><br/>';
    } else {
      document.getElementById(
        "createBatchMintProposalFormSummit"
      ).disabled = false;
      document.getElementById("csvfileupload").hidden = true;
    }
  };
  reader.readAsText(file);
  document.getElementById("createBatchMintProposalFile").value = "";
}

function createLoadMoreButton() {
  running();
  if (document.contains(document.getElementById("loadMoreProposalBlock"))) {
    document.getElementById("loadMoreProposalBlock").remove();
  }
  var viewProposalsBlock = document.getElementById("viewProposalsBlock");

  var loadMoreProposalBlock = document.createElement("div");
  loadMoreProposalBlock.setAttribute("id", "loadMoreProposalBlock");
  loadMoreProposalBlock.innerHTML = '<hr style="border: 1px dotted green;" />';
  viewProposalsBlock.appendChild(loadMoreProposalBlock);

  var execute = document.createElement("button");
  execute.setAttribute("id", "view_more_proposals");
  execute.textContent = "读取更多";
  execute.onclick = () => appendMoreProposal();
  loadMoreProposalBlock.appendChild(execute);
  done();
}

function createNoMoreText() {
  running();
  if (document.contains(document.getElementById("loadMoreProposalBlock"))) {
    document.getElementById("loadMoreProposalBlock").remove();
  }
  var viewProposalsBlock = document.getElementById("viewProposalsBlock");

  var loadMoreProposalBlock = document.createElement("div");
  loadMoreProposalBlock.setAttribute("id", "loadMoreProposalBlock");
  loadMoreProposalBlock.innerHTML = '<hr style="border: 1px dotted green;" />';
  loadMoreProposalBlock.innerHTML += "<p>已经到底，没有更多提案了</p>";
  viewProposalsBlock.appendChild(loadMoreProposalBlock);
  done();
}

function createExecuteButton(proposalData, proposalElement, serialId) {
  running();
  var execute = document.createElement("button");
  execute.setAttribute("id", `${serialId}_execute`);
  execute.textContent = "提案执行";
  execute.onclick = () =>
    executeProposal(proposalData, proposalElement, serialId);
  proposalElement.appendChild(execute);
  done();
}

function createQueuedButton(proposalData, proposalElement, serialId) {
  running();
  var execute = document.createElement("button");
  execute.setAttribute("id", `${serialId}_queue`);
  execute.textContent = "提案排程";
  execute.onclick = () =>
    queueProposal(proposalData, proposalElement, serialId);
  proposalElement.appendChild(execute);
  done();
}

async function runCreateBudgetProposal() {
  running();
  cleanLog();
  createBudgetProposal().catch((error) => printErrorLog(error, "log"));
  done();
}

async function runCreateProposal() {
  running();
  cleanLog();
  createProposal().catch((error) => printErrorLog(error, "log"));
  done();
}

async function runCreateGovernorProposal() {
  running();
  cleanLog();
  createGovernorProposal().catch((error) => printErrorLog(error, "log"));
  done();
}

async function runCreateBatchMintProposal() {
  running();
  cleanLog();
  createBatchMintProposal().catch((error) => printErrorLog(error, "log"));
  done();
}

async function createBatchMintProposal() {
  running();

  let receivers = [];
  let amountsWei = [];
  let amounts = [];

  web3 = new Web3(window.ethereum);

  uploadBatchMintData.forEach((data) => {
    receivers.unshift(data.address);
    amounts.unshift(data.amount);
    amountsWei.unshift(web3.utils.toWei(data.amount));
  });

  const nowTime = new Date();
  const description =
    "[" +
    nowTime.toISOString().replace(/[^0-9]/g, "") +
    "] " +
    document.getElementById("createBatchMintProposalDescription").value;

  document.getElementById("createBatchMintProposalFile").disabled = true;
  document.getElementById("createBatchMintProposalDescription").disabled = true;
  document.getElementById("createBatchMintProposalFormSummit").disabled = true;

  const governor = new web3.eth.Contract(governorAbi(), GOVERNOR_ADDRESS);
  const token = new web3.eth.Contract(tokenAbi(), TOKEN_ADDRESS);

  const encodedFunctionCall = web3.eth.abi.encodeFunctionCall(
    batchMintInterface(),
    [receivers, amountsWei]
  );

  const accountsAddr = await web3.eth.requestAccounts();
  const accountAddress = accountsAddr[0];

  const proposalId = await governor.methods
    .propose([TOKEN_ADDRESS], [0], [encodedFunctionCall], description)
    .call({ from: accountAddress }, (error) => printErrorLog(error, "log"));
  console.log("proposalId: " + proposalId);

  const gasPrice = await web3.eth.getGasPrice();
  const gasEstimate = await governor.methods
    .propose([TOKEN_ADDRESS], [0], [encodedFunctionCall], description)
    .estimateGas({ from: accountAddress, gas: 50000000 });
  console.log("gasEstimate: " + gasEstimate);
  console.log("gasPrice: " + gasPrice);

  var log = document.getElementById("log");
  log.style.color = "";
  log.innerHTML = "<p>上链中 ...</p>";

  let transactionHash = "<none>";
  const tx = await governor.methods
    .propose([TOKEN_ADDRESS], [0], [encodedFunctionCall], description)
    .send(
      {
        from: accountAddress,
        gas: gasEstimate,
        gasPrice,
      },
      (error, hash) => {
        printErrorLog(error, "log");
        transactionHash = hash;
        console.log("hash:", hash);
      }
    )
    .catch((sendError) => {
      console.log(sendError);
    });

  console.log("transactionHash:", transactionHash);
  await fetch(`${SERVER_URL}/api/proposal/batchMint/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      proposalId,
      proposer: accountAddress,
      receivers,
      amounts,
      description,
      proposeTx: transactionHash,
      proposeTime: nowTime.getTime(),
    }),
  });

  let resultStr = "";
  receivers.forEach((r, idx) => {
    resultStr += `对 ${r} 发放 ${amounts[idx]} 积分<br/>`;
  });

  var log = document.getElementById("log");
  log.innerHTML =
    "<p>提案编号 (Proposal ID): " +
    proposalId +
    "</p><p>描述: " +
    description.slice(20) +
    "</p><p>发放地址与数量：<br/>" +
    resultStr +
    "</p><br/><br/>" +
    '<a href="' +
    ETHERSCAN_URL +
    "tx/" +
    transactionHash +
    '" style="color:#59bfcf;" target="_blank">' +
    ETHERSCAN_URL +
    "tx/" +
    transactionHash +
    "</a>";

  initCreateBatchMintProposal(true);
  done();
}

async function createBudgetProposal() {
  const address = document
    .getElementById("createBudgetProposalAddress")
    .value.replace(/\s/g, "");
  const amount = document
    .getElementById("createBudgetProposalAmount")
    .value.replace(/\s/g, "");
  const nowTime = new Date();
  const description =
    "[" +
    nowTime.toISOString().replace(/[^0-9]/g, "") +
    "] " +
    document.getElementById("createBudgetProposalDescription").value;

  document.getElementById("createBudgetProposalAddress").disabled = true;
  document.getElementById("createBudgetProposalAmount").disabled = true;
  document.getElementById("createBudgetProposalDescription").disabled = true;
  document.getElementById("createBudgetProposalFormSummit").disabled = true;

  web3 = new Web3(window.ethereum);
  const governor = new web3.eth.Contract(governorAbi(), GOVERNOR_ADDRESS);
  const token = new web3.eth.Contract(tokenAbi(), TOKEN_ADDRESS);
  const amountWei = web3.utils.toWei(amount);

  const encodedFunctionCall = web3.eth.abi.encodeFunctionCall(
    mintAndApproveInterface(),
    [address, amountWei]
  );

  const accountsAddr = await web3.eth.requestAccounts();
  const accountAddress = accountsAddr[0];

  const proposalId = await governor.methods
    .propose([TOKEN_ADDRESS], [0], [encodedFunctionCall], description)
    .call({ from: accountAddress }, (error) => printErrorLog(error, "log"));
  console.log("proposalId: " + proposalId);

  const gasPrice = await web3.eth.getGasPrice();
  const gasEstimate = await governor.methods
    .propose([TOKEN_ADDRESS], [0], [encodedFunctionCall], description)
    .estimateGas({ from: accountAddress, gas: 50000000 });
  console.log("gasEstimate: " + gasEstimate);
  console.log("gasPrice: " + gasPrice);

  const $log = document.getElementById("log");
  $log.style.color = "";
  $log.innerHTML = "<p>上链中 ...</p>";

  let transactionHash = "<none>";
  const tx = await governor.methods
    .propose([TOKEN_ADDRESS], [0], [encodedFunctionCall], description)
    .send(
      {
        from: accountAddress,
        gas: gasEstimate,
        gasPrice,
      },
      (error, hash) => {
        printErrorLog(error, "log");
        transactionHash = hash;
        console.log("hash:", hash);
      }
    )
    .catch((sendError) => {
      console.log(sendError);
    });

  console.log("transactionHash:", transactionHash);
  const res = await fetch(`${SERVER_URL}/api/proposal/mint/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      propose_type: "budget",
      proposal_id: proposalId,
      proposer: accountAddress,
      receiver: address,
      amount,
      description,
      transaction_hash: transactionHash,
      propose_time: nowTime.getTime(),
    }),
  });

  // check for error response
  if (!res.ok) {
    const isJson = res.headers
      .get("content-type")
      ?.includes("application/json");
    const data = isJson ? await res.json() : null;
    // get error message from body or default to response status
    const error = data ? data.error || data.message : res.status;
    alert(`Server error ${error}. Please try agian later.`);
    console.error("createProposal error: ", data, res);
  }

  $log.innerHTML =
    "<p>提案编号 (Proposal ID): " +
    proposalId +
    "</p><p>申请地址: " +
    address +
    "</p><p>申请数量: " +
    amount +
    "</p><p>描述: " +
    description.slice(20) +
    "</p>" +
    '<a href="' +
    ETHERSCAN_URL +
    "tx/" +
    transactionHash +
    '" style="color:#59bfcf;" target="_blank">' +
    ETHERSCAN_URL +
    "tx/" +
    transactionHash +
    "</a>";

  initCreateBudgetProposal(true);
}

async function createProposal() {
  running();
  const address = document
    .getElementById("createProposalAddress")
    .value.replace(/\s/g, "");
  const amount = document
    .getElementById("createProposalAmount")
    .value.replace(/\s/g, "");
  const nowTime = new Date();
  const description =
    "[" +
    nowTime.toISOString().replace(/[^0-9]/g, "") +
    "] " +
    document.getElementById("createProposalDescription").value;

  document.getElementById("createProposalAddress").disabled = true;
  document.getElementById("createProposalAmount").disabled = true;
  document.getElementById("createProposalDescription").disabled = true;
  document.getElementById("createProposalFormSummit").disabled = true;

  web3 = new Web3(window.ethereum);
  const governor = new web3.eth.Contract(governorAbi(), GOVERNOR_ADDRESS);
  const token = new web3.eth.Contract(tokenAbi(), TOKEN_ADDRESS);
  const amountWei = web3.utils.toWei(amount);

  const encodedFunctionCall = web3.eth.abi.encodeFunctionCall(mintInterface(), [
    address,
    amountWei,
  ]);

  const accountsAddr = await web3.eth.requestAccounts();
  const accountAddress = accountsAddr[0];

  const proposalId = await governor.methods
    .propose([TOKEN_ADDRESS], [0], [encodedFunctionCall], description)
    .call({ from: accountAddress }, (error) => printErrorLog(error, "log"));
  console.log("proposalId: " + proposalId);

  const gasPrice = await web3.eth.getGasPrice();
  const gasEstimate = await governor.methods
    .propose([TOKEN_ADDRESS], [0], [encodedFunctionCall], description)
    .estimateGas({ from: accountAddress, gas: 50000000 });
  console.log("gasEstimate: " + gasEstimate);
  console.log("gasPrice: " + gasPrice);

  const $log = document.getElementById("log");
  $log.style.color = "";
  $log.innerHTML = "<p>上链中 ...</p>";

  let transactionHash = "<none>";
  const tx = await governor.methods
    .propose([TOKEN_ADDRESS], [0], [encodedFunctionCall], description)
    .send(
      {
        from: accountAddress,
        gas: gasEstimate,
        gasPrice,
      },
      (error, hash) => {
        printErrorLog(error, "log");
        transactionHash = hash;
        console.log("hash:", hash);
      }
    )
    .catch((sendError) => {
      console.log(sendError);
    });

  console.log("transactionHash:", transactionHash);
  const res = await fetch(`${SERVER_URL}/api/proposal/mint/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      proposal_id: proposalId,
      proposer: accountAddress,
      receiver: address,
      amount,
      description,
      transaction_hash: transactionHash,
      propose_time: nowTime.getTime(),
    }),
  });

  // check for error response
  if (!res.ok) {
    const isJson = res.headers
      .get("content-type")
      ?.includes("application/json");
    const data = isJson ? await res.json() : null;
    // get error message from body or default to response status
    const error = data ? data.error || data.message : res.status;
    alert(`Server error ${error}. Please try agian later.`);
    console.error("createProposal error: ", data, res);
  }

  $log.innerHTML =
    "<p>提案编号 (Proposal ID): " +
    proposalId +
    "</p><p>发放地址: " +
    address +
    "</p><p>发放数量: " +
    amount +
    "</p><p>描述: " +
    description.slice(20) +
    "</p>" +
    '<a href="' +
    ETHERSCAN_URL +
    "tx/" +
    transactionHash +
    '" style="color:#59bfcf;" target="_blank">' +
    ETHERSCAN_URL +
    "tx/" +
    transactionHash +
    "</a>";

  initCreateProposal(true);
  done();
}

function validParam(functionName, params) {
  if (
    ["setVotingDelay", "setVotingPeriod", "setProposalThreshold"].includes(
      functionName
    )
  ) {
    if (typeof params === "number" && params > 0) {
      return true;
    } else {
      throw new Error("新参数必须为正整数");
    }
  }
  if (["updateQuorumNumerator"].includes(functionName)) {
    if (typeof params === "number" && params >= 1 && params <= 90) {
      return true;
    } else {
      throw new Error("总投票有效门槛应在1到90之间");
    }
  }
  return false;
}

// createGovernorProposal
async function createGovernorProposal() {
  running();
  const functionName = document.getElementById("governorFunction").value;
  const params = parseInt(
    document.getElementById("governorFunctionParam").value.replace(/\s/g, ""),
    10
  );

  if (!validParam(functionName, params)) {
    return;
  }

  const nowTime = new Date();
  const description =
    "[" +
    nowTime.toISOString().replace(/[^0-9]/g, "") +
    "] " +
    document.getElementById("createProposalDescription").value;

  document.getElementById("governorFunction").disabled = true;
  document.getElementById("governorFunctionParam").disabled = true;
  document.getElementById("createGovernorProposalDescription").disabled = true;
  document.getElementById("createGovernorProposalFormSummit").disabled = true;

  web3 = new Web3(window.ethereum);
  const governor = new web3.eth.Contract(governorAbi(), GOVERNOR_ADDRESS);

  const functionAbi = settingAbi(functionName);
  console.log(functionName, functionAbi);
  const encodedFunctionCall = web3.eth.abi.encodeFunctionCall(functionAbi, [
    params,
  ]);

  const accountsAddr = await web3.eth.requestAccounts();
  const accountAddress = accountsAddr[0];

  const proposalId = await governor.methods
    .propose([GOVERNOR_ADDRESS], [0], [encodedFunctionCall], description)
    .call({ from: accountAddress }, (error) => printErrorLog(error, "log"));
  console.log("proposalId: " + proposalId);

  const gasPrice = await web3.eth.getGasPrice();
  const gasEstimate = await governor.methods
    .propose([GOVERNOR_ADDRESS], [0], [encodedFunctionCall], description)
    .estimateGas({ from: accountAddress, gas: 50000000 });
  console.log("gasEstimate: " + gasEstimate);
  console.log("gasPrice: " + gasPrice);

  const $log = document.getElementById("log");
  $log.style.color = "";
  $log.innerHTML = "<p>上链中 ...</p>";

  let transactionHash = "<none>";
  const tx = await governor.methods
    .propose([GOVERNOR_ADDRESS], [0], [encodedFunctionCall], description)
    .send(
      {
        from: accountAddress,
        gas: gasEstimate,
        gasPrice,
      },
      (error, hash) => {
        printErrorLog(error, "log");
        transactionHash = hash;
        console.log("hash:", hash);
      }
    )
    .catch((sendError) => {
      console.log(sendError);
    });

  console.log("transactionHash:", transactionHash);
  const res = await fetch(`${SERVER_URL}/api/proposal/mint/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      propose_type: "governorSetting",
      proposal_id: proposalId,
      proposer: accountAddress,
      receiver: functionName,
      amount: params,
      description,
      transaction_hash: transactionHash,
      propose_time: nowTime.getTime(),
    }),
  });

  // check for error response
  if (!res.ok) {
    const isJson = res.headers
      .get("content-type")
      ?.includes("application/json");
    const data = isJson ? await res.json() : null;
    // get error message from body or default to response status
    const error = data ? data.error || data.message : res.status;
    alert(`Server error ${error}. Please try agian later.`);
    console.error("createProposal error: ", data, res);
  }

  $log.innerHTML =
    "<p>提案编号 (Proposal ID): " +
    proposalId +
    "</p><p>治理参数: " +
    functionName +
    "</p><p>变更为: " +
    params +
    "</p><p>描述: " +
    description.slice(20) +
    "</p>" +
    '<a href="' +
    ETHERSCAN_URL +
    "tx/" +
    transactionHash +
    '" style="color:#59bfcf;" target="_blank">' +
    ETHERSCAN_URL +
    "tx/" +
    transactionHash +
    "</a>";

  initCreateProposal(true);
  done();
}

function i2hex(i) {
  return ("0" + i.toString(16)).slice(-2);
}

async function queueProposal(proposalData, proposalElement, serialId) {
  running();
  web3 = new Web3(window.ethereum);
  const accountsAddr = await web3.eth.requestAccounts();
  const accountAddress = accountsAddr[0];
  const governor = new web3.eth.Contract(governorAbi(), GOVERNOR_ADDRESS);
  const descriptionHash = web3.utils.keccak256(proposalData.description);

  console.log("proposalData.type:", proposalData.type);
  console.log("descriptionHash:", descriptionHash);

  let encodedFunctionCall;
  if (proposalData.type === "mint") {
    const amountWei = web3.utils.toWei(proposalData.amount);
    encodedFunctionCall = web3.eth.abi.encodeFunctionCall(mintInterface(), [
      proposalData.receiver,
      amountWei,
    ]);
  } else if (proposalData.type === "batchMint") {
    let amountsWei = [];
    let receviers = [];
    proposalData.amounts.forEach((a, idx) => {
      receviers.push(proposalData.receivers[idx]);
      amountsWei.push(web3.utils.toWei(a));
    });
    console.log("proposalData.receivers:", receviers);
    console.log("amountsWei:", amountsWei);
    encodedFunctionCall = web3.eth.abi.encodeFunctionCall(
      batchMintInterface(),
      [receviers, amountsWei]
    );
  }

  console.log("encodedFunctionCall:", encodedFunctionCall);

  const gasPrice = await web3.eth.getGasPrice();
  const gasEstimate = await governor.methods
    .queue([TOKEN_ADDRESS], [0], [encodedFunctionCall], descriptionHash)
    .estimateGas({ from: accountAddress, gas: 50000000 });

  console.log("gasPrice:", gasPrice);
  console.log("gasEstimate:", gasEstimate);

  var log = document.createElement("div");
  log.setAttribute("id", `${serialId}_queue_log`);
  log.style.color = "";
  log.innerHTML = "<p>上链中 ...</p>";
  proposalElement.appendChild(log);
  log = document.getElementById(`${serialId}_queue_log`);

  let transactionHash = "<none>";
  let error = null;
  const tx = await governor.methods
    .queue([TOKEN_ADDRESS], [0], [encodedFunctionCall], descriptionHash)
    .send(
      {
        from: accountAddress,
        gas: gasEstimate,
        gasPrice,
      },
      (e, hash) => {
        error = e;
        printErrorLog(error, `${serialId}_queue_log`);
        transactionHash = hash;
        console.log("hash:", hash);
      }
    )
    .catch((sendError) => {
      console.log(sendError);
    });

  if (!error) {
    log.style.color = "";
    log.innerHTML =
      '<p">排程成功!</p>' +
      '<a href="' +
      ETHERSCAN_URL +
      "tx/" +
      transactionHash +
      '" style="color:#59bfcf;" target="_blank">' +
      ETHERSCAN_URL +
      "tx/" +
      transactionHash +
      "</a>";
  }
  done();
}

async function executeProposal(proposalData, proposalElement, serialId) {
  running();
  web3 = new Web3(window.ethereum);
  const accountsAddr = await web3.eth.requestAccounts();
  const accountAddress = accountsAddr[0];
  const governor = new web3.eth.Contract(governorAbi(), GOVERNOR_ADDRESS);
  const descriptionHash = web3.utils.keccak256(proposalData.description);

  console.log("proposalData.type:", proposalData.type);

  let encodedFunctionCall;
  if (proposalData.type === "budget") {
    const amountWei = web3.utils.toWei(proposalData.amount);
    encodedFunctionCall = web3.eth.abi.encodeFunctionCall(
      mintAndApproveInterface(),
      [proposalData.receiver, amountWei]
    );
  } else if (proposalData.type === "mint") {
    const amountWei = web3.utils.toWei(proposalData.amount);
    encodedFunctionCall = web3.eth.abi.encodeFunctionCall(mintInterface(), [
      proposalData.receiver,
      amountWei,
    ]);
  } else if (proposalData.type === "batchMint") {
    let amountsWei = [];
    let receivers = [];
    proposalData.amounts.forEach((a, idx) => {
      receivers.push(proposalData.receivers[idx]);
      amountsWei.push(web3.utils.toWei(a));
    });
    console.log("proposalData.receivers:", proposalData.receivers);
    console.log("amountsWei:", amountsWei);
    encodedFunctionCall = web3.eth.abi.encodeFunctionCall(
      batchMintInterface(),
      [proposalData.receivers, amountsWei]
    );
  } else if (proposalData.type === "governorSetting") {
    encodedFunctionCall = web3.eth.abi.encodeFunctionCall(
      settingAbi(proposalData.receiver),
      [proposalData.amount]
    );
  }

  console.log("encodedFunctionCall:", encodedFunctionCall);

  const gasPrice = await web3.eth.getGasPrice();
  const gasEstimate = await governor.methods
    .execute(
      [
        proposalData.type === "governorSetting"
          ? GOVERNOR_ADDRESS
          : TOKEN_ADDRESS,
      ],
      [0],
      [encodedFunctionCall],
      descriptionHash
    )
    .estimateGas({ from: accountAddress, gas: 50000000 });

  var log = document.createElement("div");
  log.setAttribute("id", `${serialId}_execute_log`);
  log.style.color = "";
  log.innerHTML = "<p>上链中 ...</p>";
  proposalElement.appendChild(log);
  log = document.getElementById(`${serialId}_execute_log`);

  let transactionHash = "<none>";
  let error = null;
  const tx = await governor.methods
    .execute(
      [
        proposalData.type === "governorSetting"
          ? GOVERNOR_ADDRESS
          : TOKEN_ADDRESS,
      ],
      [0],
      [encodedFunctionCall],
      descriptionHash
    )
    .send(
      {
        from: accountAddress,
        gas: gasEstimate,
        gasPrice,
      },
      (e, hash) => {
        error = e;
        printErrorLog(error, `${serialId}_execute_log`);
        transactionHash = hash;
        console.log("hash:", hash);
      }
    )
    .catch((sendError) => {
      console.log(sendError);
    });

  if (!error) {
    await fetch(`${SERVER_URL}/api/proposal/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposalId: proposalData.proposalId,
        executeTx: transactionHash,
      }),
    });

    log.style.color = "";
    log.innerHTML =
      '<p">执行成功!</p>' +
      '<a href="' +
      ETHERSCAN_URL +
      "tx/" +
      transactionHash +
      '" style="color:#59bfcf;" target="_blank">' +
      ETHERSCAN_URL +
      "tx/" +
      transactionHash +
      "</a>";
  }
  done();
}

async function queryProposal() {
  var proposalNameButton = document.getElementById("proposalNameButton");
  var proposalNameInput = document.getElementById("proposalNameInput");
  const proposalId = proposalNameInput.value;
  document.getElementById("proposalNameInput").disabled = true;
  document.getElementById("proposalNameButton").disabled = true;

  if (document.body.contains(document.getElementById("queryProposalError"))) {
    document.getElementById("queryProposalError").outerHTML = "";
  }
  if (document.body.contains(document.getElementById("onChainLink"))) {
    document.getElementById("onChainLink").outerHTML = "";
  }
  if (document.body.contains(document.getElementById("holdersVotesTable"))) {
    document.getElementById("holdersVotesTable").remove();
  }
  if (
    document.body.contains(document.getElementById("check_proposal_detail"))
  ) {
    document.getElementById("check_proposal_detail").outerHTML = "";
  }

  const ret = await fetch(`${SERVER_URL}/api/proposal/find`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      proposalId,
    }),
  });
  const { data } = await ret.json();

  var checkProposalBlock = document.getElementById("checkProposalBlock");

  web3 = new Web3(window.ethereum);
  const accountsAddr = await web3.eth.requestAccounts();
  const accountAddress = accountsAddr[0];
  const governor = new web3.eth.Contract(governorAbi(), GOVERNOR_ADDRESS);
  const token = new web3.eth.Contract(erc20Abi(), TOKEN_ADDRESS);
  const symbol = await token.methods.symbol().call();
  const avgTime = await getBlockAverageTime(10);
  const holders = await getHolders();

  let error = null;
  let state = null;

  try {
    state = await governor.methods
      .state(proposalId)
      .call({ from: accountAddress });
  } catch (e) {
    error = e;
    console.error("error:", error);
    var errorMsg = document.createElement("div");
    errorMsg.id = "queryProposalError";
    errorMsg.innerHTML =
      '<br/><font size="4" color="red"><font color="red">查无此提案，请确认提案编号是否正确!</font><br/>';
    checkProposalBlock.appendChild(errorMsg);
  }
  if (!error) {
    const p = data;
    console.log("proposalId:", p.proposalId);
    const pState = proposalState(state);
    console.log("state:", state);

    console.log("serial_id:", p.serialId);

    const serialId = "check_proposal_detail";
    var proposal = document.createElement("div");
    proposal.id = serialId;
    checkProposalBlock.appendChild(proposal);
    proposal = document.getElementById(serialId);
    let proposalName = p.proposer;
    console.log("holders::::", holders);
    const holder = getHolder(holders, p.proposer);
    if (holder !== undefined && holder !== null) {
      proposalName = getHolderNameColor(holder.name);
    }
    proposal.innerHTML =
      `<br/><font size="2">提案序号: ${pState.emoji} Proposal #${p.serialId}<br/>` +
      `提案人: ${proposalName}<br/>` +
      `状态: ${pState.text}<br/>` +
      `编号: ${p.proposalId}</font><br/>`;

    const snapshot = await governor.methods
      .proposalSnapshot(p.proposalId)
      .call();
    const startTime = await web3.eth.getBlock(snapshot);
    const startTimestamp = 1000 * startTime.timestamp;
    const startTimeSec = new Date(startTimestamp).getSeconds();
    console.log("snapshot:", snapshot);
    console.log("startTimestamp:", startTimestamp);
    console.log("startTimeSec:", startTimeSec);

    proposal.innerHTML +=
      `<font size="2">时间: ${new Date(
        1000 * startTime.timestamp
      ).toLocaleString()} (区块: ${snapshot})<br/>` +
      `说明: <br/>${p.description.slice(200)}</font><br/>`;

    if (p.type === "budget") {
      let receiverMame = p.receiver;
      const holder = getHolder(holders, p.receiver);
      if (holder !== undefined && holder !== null) {
        receiverMame = getHolderNameColor(holder.name);
      }
      proposal.innerHTML += `<font size="2">操作: ${receiverMame} 申请预算 ${p.amount} $${symbol}</font><br/>`;
    } else if (p.type === "mint") {
      let receiverMame = p.receiver;
      const holder = getHolder(holders, p.receiver);
      if (holder !== undefined && holder !== null) {
        receiverMame = getHolderNameColor(holder.name);
      }
      proposal.innerHTML += `<font size="2">操作: 对 ${receiverMame} 发放积分 ${p.amount} $${symbol}</font><br/>`;
    } else if (p.type === "batchMint") {
      proposal.innerHTML += '<font size="2">操作:</font><br/>';
      p.receivers.forEach((r, idx) => {
        let receiverMame = r;
        const holder = getHolder(holders, r);
        if (holder !== undefined && holder !== null) {
          if (holder.name != "") receiverMame = getHolderNameColor(holder.name);
        }
        proposal.innerHTML += `<font size="2">对 ${receiverMame} 发放积分 ${p.amounts[idx]} $${symbol}</font><br/>`;
      });
    }

    const ddl = await governor.methods.proposalDeadline(p.proposalId).call();
    console.log("ddl:", ddl);
    let ddlTime = null;
    try {
      ddlTime = await web3.eth.getBlock(ddl);
    } catch (e) {}
    console.log("ddlTime:", ddlTime);

    let ddlTimestamp = 0;
    let ddlEstimateMode = "";
    if (ddlTime === null) {
      console.log(
        "(ddl - snapshot) * Block avgtime:",
        (ddl - snapshot) * avgTime
      );
      const ddlToStartSec = new Date(startTimestamp).setSeconds(
        startTimeSec + (ddl - snapshot) * avgTime
      );
      console.log("ddlToStartSec:", ddlToStartSec);
      const ddlTimeSec = new Date(ddlToStartSec);
      console.log("ddlTimeSec:", ddlTimeSec);
      ddlEstimateMode = "约剩";
      ddlTimestamp = ddlTimeSec.getTime();
    } else {
      ddlEstimateMode = "估计";
      ddlTimestamp = 1000 * ddlTime.timestamp;
    }

    console.log("ddl:", ddl);
    console.log("ddlTime:", ddlTime);
    let timeover = "";
    let voteResultStr = "投票结果";
    const isOver = ddlTimestamp - new Date().getTime() < 0;
    if (isOver && ddlTime !== null) {
      timeover = "(已结束)";
      voteResultStr = "最终" + voteResultStr;
      ddlModeStr = "投票";
    } else {
      voteResultStr = "最新" + voteResultStr;
      ddlModeStr = "估计";
    }
    const remainMins = (ddlTimestamp - new Date().getTime()) / 60000.0;
    let remainMinsStr = "";
    if (remainMins > 0) {
      remainMinsStr = `, ${ddlEstimateMode} ${remainMins.toFixed(0)} 分`;
    } else if (remainMins <= 0 && ddlTime === null) {
      remainMinsStr = ", 即将完成";
    }

    proposal.innerHTML += `<font size="2">${ddlModeStr}截止时间: ${new Date(
      ddlTimestamp
    ).toLocaleString()} (区块: ${ddl}${remainMinsStr}) ${timeover}</font>`;

    var onChainLink = document.createElement("div");
    onChainLink.id = "onChainLink";
    onChainLink.innerHTML =
      '<font size="2">链上信息:&nbsp;<a href="' +
      ETHERSCAN_URL +
      "tx/" +
      p.proposeTx +
      '" style="color:#59bfcf;" target="_blank">' +
      "提案</a></font>";
    if ("executeTx" in p) {
      onChainLink.innerHTML +=
        '<font size="2">&nbsp;|&nbsp;<a href="' +
        ETHERSCAN_URL +
        "tx/" +
        p.executeTx +
        '" style="color:#59bfcf;" target="_blank">' +
        "执行</a></font><br/>";
    }
    onChainLink.innerHTML +=
      '<hr style="border: 1px dotted green;" /><br/>投票分布 </font> <small>无投票权不予显示</small>:<br/>';
    proposal.appendChild(onChainLink);

    const votes = await governor.methods.proposalVotes(p.proposalId).call();

    const totalVotes = web3.utils
      .toBN(votes.forVotes)
      .add(web3.utils.toBN(votes.againstVotes))
      .add(web3.utils.toBN(votes.abstainVotes));

    console.log("votes:", votes);
    console.log("totalVotes:", totalVotes);

    const hasVoted = await governor.methods
      .hasVoted(p.proposalId, accountAddress)
      .call();
    console.log("hasVoted:", hasVoted);
    const myVotesWei = await governor.methods
      .getVotes(accountAddress, snapshot)
      .call();
    console.log("myVotesWei:", myVotesWei);
    const quorum = await governor.methods.quorum(snapshot).call();

    let hasVoteStr = "(未投票)";
    if (hasVoted) {
      hasVoteStr = "(已投票)";
    }

    console.log(startTime.timestamp);

    proposal.innerHTML +=
      `<font size="2">${voteResultStr}: 同意: ${Web3.utils.fromWei(
        votes.forVotes,
        "ether"
      )}, 反对: ${Web3.utils.fromWei(
        votes.againstVotes,
        "ether"
      )}, 弃权: ${Web3.utils.fromWei(votes.abstainVotes, "ether")}<br/>` +
      `总投票数有效门槛: ${Web3.utils.fromWei(
        totalVotes,
        "ether"
      )}/${Web3.utils.fromWei(quorum, "ether")}<br/>` +
      `我的投票权： ${Web3.utils.fromWei(
        myVotesWei,
        "ether"
      )} ${hasVoteStr}<br/></font><br/>`;

    var voteAction = document.createElement("span");
    var forVotes = document.createElement("button");
    forVotes.textContent = "同意";
    forVotes.onclick = () => castVote(p.proposalId, 1, serialId, proposal);
    var againstVotes = document.createElement("button");
    againstVotes.textContent = "反对";
    againstVotes.onclick = () => castVote(p.proposalId, 0, serialId, proposal);
    var abstainVotes = document.createElement("button");
    abstainVotes.textContent = "弃权";
    abstainVotes.onclick = () => castVote(p.proposalId, 2, serialId, proposal);

    if (!hasVoted && !isOver) {
      voteAction.appendChild(forVotes);
      voteAction.appendChild(document.createTextNode("  "));
      voteAction.appendChild(againstVotes);
      voteAction.appendChild(document.createTextNode("  "));
      voteAction.appendChild(abstainVotes);
      proposal.appendChild(voteAction);
    }

    console.log("governorType: ", GOVERNOR_TYPE);

    if (GOVERNOR_TYPE == "NoTLGovernor") {
      if (pState.en === "Succeeded") {
        createExecuteButton(p, proposal, serialId);
      }
    } else {
      if (pState.en === "Succeeded") {
        createQueuedButton(p, proposal, serialId);
      }

      if (pState.en === "Queued") {
        createExecuteButton(p, proposal, serialId);
      }
    }

    var holdersVotesTable = document.createElement("table");
    holdersVotesTable.setAttribute("id", "holdersVotesTable");
    checkProposalBlock.appendChild(holdersVotesTable);
    holdersVotesTable = document.getElementById("holdersVotesTable");
    holdersVotesTable.style = "text-align: right;";
    thead = holdersVotesTable.createTHead();
    thRow = thead.insertRow();
    thRow.style = "text-align: center;";
    thRow.insertCell().innerText = "投票人";
    thRow.insertCell().innerText = "投票权";
    thRow.insertCell().innerText = "";
    thRow.insertCell().innerText = "结果";
    thRow.insertCell().innerText = "记录";
    thRow.insertCell().innerText = "投票人地址";
    tbody = holdersVotesTable.createTBody();

    console.log("holders::", holders);
    g_holders = [];
    const currentBlock = await web3.eth.getBlockNumber();
    const totalSupplyWei = await token.methods.totalSupply().call();
    const totalSupply = web3.utils.fromWei(totalSupplyWei, "ether");

    for (var vi = 0; vi < holders.length; vi++) {
      const addr = holders[vi].address;
      let name = holders[vi].name;
      console.log("addr::", addr);
      if (name === "") name = getShortAddress(addr);
      else name = getHolderNameColor(name);
      const holderTokensWei = await token.methods.balanceOf(addr).call();
      console.log("addr:", addr);
      const getVotesWei = await governor.methods
        .getVotes(addr, snapshot)
        .call();
      console.log("holder getVotesWei::", getVotesWei);
      const holderVotes = web3.utils.fromWei(getVotesWei, "ether");
      const holderTokens = web3.utils.fromWei(holderTokensWei, "ether");
      console.log("holder tokens::", holderTokens);
      console.log("holder votes::", holderVotes);
      const holderVotesRatio =
        (100 * Number(holderVotes)) / Number(totalSupply);

      if (getVotesWei > 0) {
        thRow = thead.insertRow();
        thRow.insertCell().innerHTML = name + " | ";
        thRow.insertCell().innerText = holderVotes.toString() + " | ";
        thRow.insertCell().innerText = `${holderVotesRatio.toFixed(2)}% | `;

        const pastResults = await governor.getPastEvents("VoteCast", {
          filter: { voter: holders[vi].address },
          fromBlock: snapshot,
          toBlock: ddl,
        });

        let hasVoted = false;
        let vote = "";
        let tx = "";
        if (pastResults !== null && pastResults !== undefined) {
          const votelog = pastResults.find(
            (p) => p.returnValues.proposalId === proposalId
          );
          if (votelog !== undefined) {
            tx = votelog.transactionHash;
            console.log("votelog:", votelog.transactionHash);
            console.log("votelog.returnValues: ", votelog.returnValues);
            console.log(
              "votelog.returnValues.support: ",
              votelog.returnValues.support
            );
            if (votelog.returnValues.support === "0") {
              vote = '<font color="red">反对</font>';
            } else if (votelog.returnValues.support === "1") {
              vote = '<font color="white">同意</font>';
            } else if (votelog.returnValues.support === "2") {
              vote = '<font color="#808080">弃权</font>';
            }
          }
        }
        thRow.insertCell().innerHTML = vote + " | ";
        if (tx !== "") {
          thRow.insertCell().innerHTML = `<a href="${ETHERSCAN_URL}tx/${tx}" style="color:#59bfcf;" target="_blank">link</a> | `;
        } else {
          thRow.insertCell().innerHTML = " | ";
        }

        thRow.insertCell().innerText = addr;

        g_holders.push({
          name,
          holderVotes,
          holderVotesRatio,
          address: addr,
        });
      }
    }

    if (g_holders.length > 0) {
      document.getElementById("proposalNameInput").value = "";
      checkProposalBlock.innerHTML += "<br/><small>∎</small>";
    }

    // function compare( a, b ) {
    //   if ( Number(a.holderTokens) > Number(b.holderTokens) ){
    //     return -1;
    //   }
    //   if ( Number(a.holderTokens) < Number(b.holderTokens) ){
    //     return 1;
    //   }
    //   return 0;
    // }

    // g_holders.sort( compare );

    // checkProposalBlock.removeChild(document.getElementById("holdersVotesTable"))
    // holdersVotesTable = document.createElement("table")
    // holdersVotesTable.setAttribute("id","holdersVotesTable")
    // checkProposalBlock.appendChild(holdersVotesTable)
    // holdersVotesTable = document.getElementById("holdersVotesTable")
    // holdersVotesTable.style = "text-align: right;"
    // thead = holdersVotesTable.createTHead()
    // thRow = thead.insertRow()
    // thRow.style = "text-align: center;"
    // thRow.insertCell().innerText = "持有人"
    // thRow.insertCell().innerText = "投票代理人"
    // thRow.insertCell().innerText = "积分"
    // thRow.insertCell().innerText = ""
    // thRow.insertCell().innerText = "投票权"
    // thRow.insertCell().innerText = ""
    // thRow.insertCell().innerText = "持有人地址"
    // thRow.insertCell().innerText = "投票代理人地址"
    // tbody = holdersVotesTable.createTBody()

    // g_holders.forEach((h) => {
    //   thRow = thead.insertRow()
    //   console.log('h.delegateeName::',h.delegateeName)
    //   let delegateeName = h.delegateeName
    //   if(delegateeName==="") delegateeName = getShortAddress(h.delegatee)
    //   thRow.insertCell().innerHTML = h.name + ' | '
    //   thRow.insertCell().innerHTML = delegateeName + ' | '
    //   thRow.insertCell().innerText = h.holderTokens.toString() + ' | '
    //   thRow.insertCell().innerText = `${h.holderTokensRatio.toFixed(2)}% | `
    //   thRow.insertCell().innerText = h.holderVotes.toString() + ' | '
    //   thRow.insertCell().innerText = `${h.holderVotesRatio.toFixed(2)}% | `
    //   thRow.insertCell().innerText = h.address+ ' | '
    //   thRow.insertCell().innerText = h.delegatee
    // })
  } else {
  }

  document.getElementById("proposalNameInput").disabled = false;
  document.getElementById("proposalNameButton").disabled = false;
}

async function castVote(proposalId, vote, serialId, proposalElement) {
  running();
  web3 = new Web3(window.ethereum);
  const accountsAddr = await web3.eth.requestAccounts();
  const accountAddress = accountsAddr[0];
  const governor = new web3.eth.Contract(governorAbi(), GOVERNOR_ADDRESS);

  const gasPrice = await web3.eth.getGasPrice();
  const gasEstimate = await governor.methods
    .castVote(proposalId, vote)
    .estimateGas({ from: accountAddress, gas: 50000000 });

  var log = document.createElement("div");
  log.setAttribute("id", `${serialId}_log`);
  log.style.color = "";
  log.innerHTML = "<p>上链中 ...</p>";
  proposalElement.appendChild(log);
  log = document.getElementById(`${serialId}_log`);

  let transactionHash = "<none>";
  let error = null;
  const tx = await governor.methods
    .castVote(proposalId, vote)
    .send(
      {
        from: accountAddress,
        gas: gasEstimate,
        gasPrice,
      },
      (e, hash) => {
        error = e;
        printErrorLog(error, `${serialId}_log`);
        transactionHash = hash;
        console.log("hash:", hash);
      }
    )
    .catch((sendError) => {
      console.log(sendError);
    });

  if (!error) {
    log.style.color = "";
    log.innerHTML =
      '<p">投票成功! ' +
      '</p><p>我投 "' +
      voteState(vote).text +
      '"</p>' +
      '<a href="' +
      ETHERSCAN_URL +
      "tx/" +
      transactionHash +
      '" style="color:#59bfcf;" target="_blank">' +
      ETHERSCAN_URL +
      "tx/" +
      transactionHash +
      "</a>";
  }
  done();
}

async function initCheckProposal(cleanup) {
  running();
  var checkProposalBlock = document.getElementById("checkProposalBlock");
  checkProposalBlock.innerHTML = "<h3>提案查询</h3>";

  web3 = new Web3(window.ethereum);
  const accountsAddr = await web3.eth.requestAccounts();
  const accountAddress = accountsAddr[0];
  const governor = new web3.eth.Contract(governorAbi(), GOVERNOR_ADDRESS);
  const token = new web3.eth.Contract(erc20Abi(), TOKEN_ADDRESS);
  const symbol = await token.methods.symbol().call();
  const decimals = await token.methods.decimals().call();

  var proposalName = document.createElement("div");
  checkProposalBlock.appendChild(proposalName);
  var proposalNameInput = document.createElement("input");
  proposalNameInput.id = "proposalNameInput";
  proposalNameInput.type = "text";
  var proposalNameButton = document.createElement("button");
  proposalNameButton.id = "proposalNameButton";
  proposalNameButton.innerText = "查询";
  proposalNameButton.onclick = () => queryProposal();
  proposalName.appendChild(document.createTextNode("提案编号 (Proposal ID): "));
  proposalName.appendChild(proposalNameInput);
  proposalName.appendChild(document.createTextNode(" "));
  proposalName.appendChild(proposalNameButton);

  done();
}

async function initGovernParameters(cleanup) {
  running();
  var governParametersBlock = document.getElementById("governParametersBlock");
  governParametersBlock.innerHTML = "<h3>治理参数</h3>";

  web3 = new Web3(window.ethereum);
  const accountsAddr = await web3.eth.requestAccounts();
  const accountAddress = accountsAddr[0];
  const governor = new web3.eth.Contract(governorAbi(), GOVERNOR_ADDRESS);
  const token = new web3.eth.Contract(erc20Abi(), TOKEN_ADDRESS);
  const symbol = await token.methods.symbol().call();
  const decimals = await token.methods.decimals().call();

  governParametersBlock.innerHTML +=
    "<h4>积分合约 <small>(ERC20Votes)</small></h4>";
  const tokenName = await token.methods.name().call();
  governParametersBlock.innerHTML += `<font size="2">积分名称: ${tokenName}</font><br/>`;
  governParametersBlock.innerHTML += `<font size="2">积分代号: ${symbol}</font><br/>`;
  const totalSupply = await token.methods.totalSupply().call();
  governParametersBlock.innerHTML += `<font size="2">总发行量: ${web3.utils.fromWei(
    totalSupply,
    "ether"
  )} $${symbol}</font><br/>`;

  governParametersBlock.innerHTML += `<a href=\"${ETHERSCAN_URL}token/${TOKEN_ADDRESS}\" style="color:#59bfcf;" target="_blank">代币合约链上信息</a><br/><br/>`;

  governParametersBlock.innerHTML +=
    "<h4>投票合约 <small>(OpenZeppelin Governor)</small></h4>";

  const governorName = await governor.methods.name().call();
  governParametersBlock.innerHTML += `<font size="2">合约名称: ${governorName}</font><br/>`;
  const votingDelay = await governor.methods.votingDelay().call();
  const avgTime = await getBlockAverageTime(2);
  governParametersBlock.innerHTML += `<font size="2">投票延迟: ${votingDelay} 区块 (约 ${
    votingDelay * avgTime
  } 秒)</font><br/>`;
  const votingPeriod = await governor.methods.votingPeriod().call();
  governParametersBlock.innerHTML += `<font size="2">投票期间: ${votingPeriod} 区块 (约 ${
    (votingPeriod * avgTime) / 60.0
  } 分)</font><br/>`;
  const proposalThresholdWei = await governor.methods
    .proposalThreshold()
    .call();

  governParametersBlock.innerHTML += `<font size="2">提案门槛: ${web3.utils.fromWei(
    proposalThresholdWei,
    "ether"
  )} $${symbol}</font><br/>`;
  const quorumDenominator = await governor.methods.quorumDenominator().call();
  const quorumNumerator = await governor.methods.quorumNumerator().call();
  const quorumRatio =
    (Number(quorumNumerator) + 0.0) / (Number(quorumDenominator) + 0.0);
  governParametersBlock.innerHTML += `<font size="2">总投票有效门槛: ${Number(
    100 * quorumRatio
  )}%</font><br/>`;
  const tokenAddress = await governor.methods.token().call();
  const governorVersion = await governor.methods.version().call();
  governParametersBlock.innerHTML += `<font size="2">合约版本: v${governorVersion}</font><br/>`;

  governParametersBlock.innerHTML += `<a href=\"${ETHERSCAN_URL}address/${GOVERNOR_ADDRESS}\" style="color:#59bfcf;" target="_blank">投票合约链上信息</a><br/><br/>`;
  done();
}

async function initSetDelegates(cleanup) {
  running();
  var setDelegatesBlock = document.getElementById("setDelegatesBlock");
  setDelegatesBlock.innerHTML = "<h3>投票代理人变更</h3>";

  web3 = new Web3(window.ethereum);
  const accountsAddr = await web3.eth.requestAccounts();
  const accountAddress = accountsAddr[0];
  const governor = new web3.eth.Contract(governorAbi(), GOVERNOR_ADDRESS);
  const token = new web3.eth.Contract(erc20Abi(), TOKEN_ADDRESS);
  const symbol = await token.methods.symbol().call();

  cleanUpSetDelegates(cleanup);
  done();
}

function cleanUpSetDelegates(cleanup) {
  running();
  if (cleanup) {
    var delegateOtherAddress =
      document.getElementById("delegateOtherAddress") || {};
    delegateOtherAddress.value = "";
  }
  done();
}

function cleanUpViewHolders(cleanup) {
  running();
  if (cleanup) {
    var delegateOtherAddress =
      document.getElementById("delegateOtherAddress") || {};
    delegateOtherAddress.value = "";
  }
  done();
}

async function getMoreProposals() {
  running();
  const ret = await fetch(`${SERVER_URL}/api/proposal/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      offset: proposalOffset,
      limit: pagination,
    }),
  });
  const { data } = await ret.json();
  console.log("data:", data);
  if (data.length > 0) proposalOffset = proposalOffset + pagination;
  done();
  return data;
}

async function appendMoreProposal() {
  running();
  var execute = document.getElementById("view_more_proposals");
  execute.disabled = true;

  var viewProposalsBlock = document.getElementById("viewProposalsBlock");

  const data = await getMoreProposals();
  if (data.length > 0) {
    web3 = new Web3(window.ethereum);
    const accountsAddr = await web3.eth.requestAccounts();
    const accountAddress = accountsAddr[0];
    const governor = new web3.eth.Contract(governorAbi(), GOVERNOR_ADDRESS);
    const token = new web3.eth.Contract(erc20Abi(), TOKEN_ADDRESS);
    const symbol = await token.methods.symbol().call();
    const avgTime = await getBlockAverageTime(10);
    const holders = await getHolders();

    data.forEach((p, index) =>
      showProposal(
        web3,
        p,
        index,
        governor,
        accountAddress,
        avgTime,
        symbol,
        holders
      )
    );
    setTimeout(() => {
      var execute = document.getElementById("view_more_proposals");
      execute.disabled = false;
    }, (data.length + 1) * 1500 + 50);
  } else {
    createNoMoreText();
  }
  done();
}

async function initViewProposals(cleanup) {
  running();
  var viewProposalsBlock = document.getElementById("viewProposalsBlock");
  viewProposalsBlock.innerHTML = "<h3>提案一览</h3>";

  const data = await getMoreProposals();
  if (data.length > 0) {
    web3 = new Web3(window.ethereum);
    const accountsAddr = await web3.eth.requestAccounts();
    const accountAddress = accountsAddr[0];
    const governor = new web3.eth.Contract(governorAbi(), GOVERNOR_ADDRESS);
    const token = new web3.eth.Contract(erc20Abi(), TOKEN_ADDRESS);
    const symbol = await token.methods.symbol().call();
    const avgTime = await getBlockAverageTime(10);
    const holders = await getHolders();

    data.forEach((p, index) =>
      showProposal(
        web3,
        p,
        index,
        governor,
        accountAddress,
        avgTime,
        symbol,
        holders
      )
    );

    setTimeout(() => {
      if (document.contains(document.getElementById("view_more_proposals"))) {
        var execute = document.getElementById("view_more_proposals");
        execute.disabled = false;
      } else {
        setTimeout(() => {
          if (
            document.contains(document.getElementById("view_more_proposals"))
          ) {
            var execute = document.getElementById("view_more_proposals");
            execute.disabled = false;
          }
        }, 2 * data.length * 1500 + 50);
      }
    }, (data.length + 1) * 1500 + 50);
    done();
  } else {
    viewProposalsBlock.innerHTML += "<p>还没有任何提案。</p>";
  }
}

function showProposal(
  web3,
  p,
  index,
  governor,
  accountAddress,
  avgTime,
  symbol,
  holders
) {
  running();
  setTimeout(async () => {
    let error = null;
    let state = null;

    try {
      state = await governor.methods
        .state(p.proposalId)
        .call({ from: accountAddress });
    } catch (e) {
      error = e;
      console.error("error:", error);
    }
    if (!error) {
      console.log("proposalId:", p.proposalId);
      const pState = proposalState(state);
      console.log("state:", state);

      console.log("serial_id:", p.serialId);

      const serialId = `proposal_${p.serialId}`;
      var proposal = document.createElement("div");
      proposal.id = serialId;
      viewProposalsBlock.appendChild(proposal);
      proposal = document.getElementById(serialId);
      let proposalName = p.proposer;
      console.log("holders::::", holders);
      const holder = getHolder(holders, p.proposer);
      if (holder !== undefined && holder !== null) {
        proposalName = getHolderNameColor(holder.name);
      }
      proposal.innerHTML =
        `<hr style="border: 1px dotted green;" /><h5>${pState.emoji} Proposal #${p.serialId}</h5>` +
        `<font size="2">提案人: ${proposalName}<br/>` +
        `提案状态: ${pState.text}<br/>` +
        `提案编号: ${p.proposalId}</font><br/>`;

      const snapshot = await governor.methods
        .proposalSnapshot(p.proposalId)
        .call();
      const startTime = await web3.eth.getBlock(snapshot);
      let startTimestamp = new Date().getTime();
      if ("timestamp" in startTime) {
        startTimestamp = 1000 * startTime.timestamp;
      }
      const startTimeSec = new Date(startTimestamp).getSeconds();
      console.log("snapshot:", snapshot);
      console.log("startTimestamp:", startTimestamp);
      console.log("startTimeSec:", startTimeSec);

      proposal.innerHTML +=
        `<font size="2">提案时间: ${new Date(
          1000 * startTime.timestamp
        ).toLocaleString()} (区块: ${snapshot})<br/>` +
        `提案说明: ${p.description.slice(20)}</font><br/>`;

      if (p.type === "budget") {
        let receiverMame = p.receiver;
        const holder = getHolder(holders, p.receiver);
        if (holder !== undefined && holder !== null) {
          if (holder.name !== "") {
            receiverMame = getHolderNameColor(holder.name);
          }
        }
        proposal.innerHTML += `<font size="2">提案操作: ${receiverMame} 申请预算 ${p.amount} $${symbol}</font><br/>`;
      } else if (p.type === "mint") {
        let receiverMame = p.receiver;
        const holder = getHolder(holders, p.receiver);
        if (holder !== undefined && holder !== null) {
          if (holder.name !== "") {
            receiverMame = getHolderNameColor(holder.name);
          }
        }
        proposal.innerHTML += `<font size="2">提案操作: 对 ${receiverMame} 发放积分 ${p.amount} $${symbol}</font><br/>`;
      } else if (p.type === "batchMint") {
        proposal.innerHTML += '<font size="2">提案操作:</font><br/>';
        p.receivers.forEach((r, idx) => {
          let receiverMame = r;
          const holder = getHolder(holders, r);
          if (holder !== undefined && holder !== null) {
            if (holder.name != "")
              receiverMame = getHolderNameColor(holder.name);
          }
          proposal.innerHTML += `<font size="2">对 ${receiverMame} 发放积分 ${p.amounts[idx]} $${symbol}</font><br/>`;
        });
      } else if (p.type === "governorSetting") {
        let functionName = p.receiver;
        let paramName = {
          setProposalThreshold: "提案门槛（需要持有多少积分才能发起提案）",
          setVotingDelay: "投票延迟（提案上链后经过多少区块开始投票）",
          setVotingPeriod: "投票时长（开始投票后经过多少区块结束）",
          updateQuorumNumerator: "总投票有效门槛",
        }[functionName];
        proposal.innerHTML += `<font size="2">提案操作: 将 ${
          paramName ? paramName : functionName
        } 改为 ${p.amount}${
          paramName === "updateQuorumNumerator" ? "%" : ""
        }</font><br/>`;
      }

      const ddl = await governor.methods.proposalDeadline(p.proposalId).call();
      console.log("ddl:", ddl);
      let ddlTime = null;
      try {
        ddlTime = await web3.eth.getBlock(ddl);
      } catch (e) {}
      console.log("ddlTime:", ddlTime);

      let ddlTimestamp = 0;
      let ddlEstimateMode = "";
      if (ddlTime === null) {
        console.log(
          "(ddl - snapshot) * Block avgtime:",
          (ddl - snapshot) * avgTime
        );
        const ddlToStartSec = new Date(startTimestamp).setSeconds(
          startTimeSec + (ddl - snapshot) * avgTime
        );
        console.log("ddlToStartSec:", ddlToStartSec);
        const ddlTimeSec = new Date(ddlToStartSec);
        console.log("ddlTimeSec:", ddlTimeSec);
        ddlEstimateMode = "约剩";
        ddlTimestamp = ddlTimeSec.getTime();
      } else {
        ddlEstimateMode = "估计";
        ddlTimestamp = 1000 * ddlTime.timestamp;
      }

      console.log("ddl:", ddl);
      console.log("ddlTime:", ddlTime);
      let timeover = "";
      let voteResultStr = "投票结果";
      const isOver = ddlTimestamp - new Date().getTime() < 0;
      let ddlModeStr;
      if (isOver && ddlTime !== null) {
        timeover = "(已结束)";
        voteResultStr = "最终" + voteResultStr;
        ddlModeStr = "投票";
      } else {
        voteResultStr = "最新" + voteResultStr;
        ddlModeStr = "估计";
      }
      const remainMins = (ddlTimestamp - new Date().getTime()) / 60000.0;
      let remainMinsStr = "";
      if (remainMins > 0) {
        remainMinsStr = `, ${ddlEstimateMode} ${remainMins.toFixed(0)} 分`;
      } else if (remainMins <= 0 && ddlTime === null) {
        remainMinsStr = ", 即将完成";
      }

      proposal.innerHTML += `<font size="2">${ddlModeStr}截止时间: ${new Date(
        ddlTimestamp
      ).toLocaleString()} (区块: ${ddl}${remainMinsStr}) ${timeover}</font>`;

      var onChainLink = document.createElement("div");
      onChainLink.id = "onChainLink";
      onChainLink.innerHTML =
        '<br/><font size="2">链上信息:&nbsp;<a href="' +
        ETHERSCAN_URL +
        "tx/" +
        p.proposeTx +
        '" style="color:#59bfcf;" target="_blank">' +
        "提案</a></font>";
      if ("executeTx" in p) {
        onChainLink.innerHTML +=
          '<font size="2">&nbsp;|&nbsp;<a href="' +
          ETHERSCAN_URL +
          "tx/" +
          p.executeTx +
          '" style="color:#59bfcf;" target="_blank">' +
          "执行</a></font>";
      }
      onChainLink.innerHTML += "<br/>";
      proposal.appendChild(onChainLink);

      const votes = await governor.methods.proposalVotes(p.proposalId).call();

      const totalVotes = web3.utils
        .toBN(votes.forVotes)
        .add(web3.utils.toBN(votes.againstVotes))
        .add(web3.utils.toBN(votes.abstainVotes));

      console.log("votes:", votes);
      console.log("totalVotes:", totalVotes);

      const hasVoted = await governor.methods
        .hasVoted(p.proposalId, accountAddress)
        .call();
      console.log("hasVoted:", hasVoted);
      const myVotesWei = await governor.methods
        .getVotes(accountAddress, snapshot)
        .call();
      console.log("myVotesWei:", myVotesWei);
      const quorum = await governor.methods.quorum(snapshot).call();

      let hasVoteStr = "(未投票)";
      if (hasVoted) {
        hasVoteStr = "(已投票)";
      }

      console.log(startTime.timestamp);

      proposal.innerHTML +=
        `<font size=\"2\">${voteResultStr}: 同意: ${Web3.utils.fromWei(
          votes.forVotes,
          "ether"
        )}, 反对: ${Web3.utils.fromWei(
          votes.againstVotes,
          "ether"
        )}, 弃权: ${Web3.utils.fromWei(votes.abstainVotes, "ether")}<br/>` +
        `总投票数有效门槛: ${Web3.utils.fromWei(
          totalVotes,
          "ether"
        )}/${Web3.utils.fromWei(quorum, "ether")}<br/>` +
        `我的投票权： ${Web3.utils.fromWei(
          myVotesWei,
          "ether"
        )} ${hasVoteStr}<br/></font><br/>`;

      var voteAction = document.createElement("span");
      var forVotes = document.createElement("button");
      forVotes.textContent = "同意";
      forVotes.onclick = () => castVote(p.proposalId, 1, serialId, proposal);
      var againstVotes = document.createElement("button");
      againstVotes.textContent = "反对";
      againstVotes.onclick = () =>
        castVote(p.proposalId, 0, serialId, proposal);
      var abstainVotes = document.createElement("button");
      abstainVotes.textContent = "弃权";
      abstainVotes.onclick = () =>
        castVote(p.proposalId, 2, serialId, proposal);

      if (!hasVoted && !isOver) {
        voteAction.appendChild(forVotes);
        voteAction.appendChild(document.createTextNode("  "));
        voteAction.appendChild(againstVotes);
        voteAction.appendChild(document.createTextNode("  "));
        voteAction.appendChild(abstainVotes);
        proposal.appendChild(voteAction);
      }

      if (GOVERNOR_TYPE == "NoTLGovernor") {
        if (pState.en === "Succeeded") {
          createExecuteButton(p, proposal, serialId);
        }
      } else {
        if (pState.en === "Succeeded") {
          createQueuedButton(p, proposal, serialId);
        }

        if (pState.en === "Queued") {
          createExecuteButton(p, proposal, serialId);
        }
      }

      var footer = document.createElement("div");
      footer.innerHTML = '<font size="2" color="gray">∎</font>';
      proposal.appendChild(footer);
    }
    createLoadMoreButton();
  }, index * 1500 + 50);
  done();
}

function initCreateBudgetProposal(cleanup) {
  running();
  const $address = document.getElementById("createBudgetProposalAddress");
  $address.disabled = true;
  document.getElementById("createBudgetProposalAmount").disabled = false;
  document.getElementById("createBudgetProposalDescription").disabled = false;
  document.getElementById("createBudgetProposalFormSummit").disabled = false;
  if (cleanup) {
    $address.value = accountAddress;
    console.log("accountAddress:", accountAddress, $address.value);
    document.getElementById("createBudgetProposalAmount").value = "";
    document.getElementById("createBudgetProposalDescription").value = "";
  }
  done();
}

function initCreateProposal(cleanup) {
  running();
  document.getElementById("createProposalAddress").disabled = false;
  document.getElementById("createProposalAmount").disabled = false;
  document.getElementById("createProposalDescription").disabled = false;
  document.getElementById("createProposalFormSummit").disabled = false;
  if (cleanup) {
    document.getElementById("createProposalAddress").value = "";
    document.getElementById("createProposalAmount").value = "";
    document.getElementById("createProposalDescription").value = "";
  }
  done();
}

function initCreateGovernorProposal(cleanup) {
  running();
  document.getElementById("governorFunction").disabled = false;
  document.getElementById("governorFunctionParam").disabled = false;
  document.getElementById("createGovernorProposalDescription").disabled = false;
  document.getElementById("createGovernorProposalFormSummit").disabled = false;
  if (cleanup) {
    document.getElementById("governorFunction").value = "";
    document.getElementById("governorFunctionParam").value = "";
    document.getElementById("createGovernorProposalDescription").value = "";
  }
  done();
}

function initCreateBatchMintProposal(cleanup) {
  running();
  document.getElementById(
    "createBatchMintProposalDescription"
  ).disabled = false;
  document.getElementById("createBatchMintProposalFile").disabled = false;
  document.getElementById("createBatchMintProposalFormSummit").disabled = true;
  document.getElementById("csvfileupload").hidden = false;
  if (cleanup) {
    document.getElementById("createBatchMintProposalFile").value = "";
    document.getElementById("createBatchMintProposalDescription").value = "";
    document.getElementById("csvpreview").innerHTML =
      "<small>第一排为地址, 第二排为积分数量, 地址可重复(但会浪费Gas), 记得包含标题, 格式如下:</small><br /><small>address,amount</small><br /><small>0x123...456,100</small><br /><small>0x456...789,50</small><br /><small>0x321...666,20</small><br />";
    document.getElementById("csvpreview").innerHTML +=
      '<font size="2"><a style="color:#59bfcf;" href="data:application/octet-stream,address%2Camount%0A0x490ee9a3dfe5fa4c65a4a65b3fe178a3c12398a6%2C100%0A0xa672f027765d044ea786149c86daef1c0344f901%2C50%0A" download="batchmint.csv">范例档案</a></font>';
  }
  done();
}

function cleanLog() {
  running();
  var log = document.getElementById("log");
  log.innerHTML = "";
  done();
}

function toDecial(value, decimals = 18) {
  const BN = Web3.utils.BN;
  if (typeof value !== "string" && !(value instanceof String)) {
    throw new Error("Pass strings to prevent floating point precision issues.");
  }
  const ten = new BN(10);
  const base = ten.pow(new BN(decimals));

  // Is it negative?
  let negative = value.substring(0, 1) === "-";
  if (negative) {
    value = value.substring(1);
  }

  if (value === ".") {
    throw new Error(
      `Invalid value ${value} cannot be converted to` +
        ` base unit with ${decimals} decimals.`
    );
  }

  const whole = new BN(value);
  let ether = whole.div(base);
  const fraction = whole.mod(base).toString();
  const fractionLength = fraction.replace(/0*$/, "").length;

  if (negative) {
    ether = ether.neg();
  }
  const res = parseFloat(
    ether.toString().concat(".", fraction.padStart(decimals, "0"))
  ).toFixed(fractionLength ? (fractionLength > 2 ? 2 : fractionLength) : 0);

  return res;
}

async function callProxy(contract, method, from, args) {
  const interface = args
    ? contract.methods[method](...args)
    : contract.methods[method]();
  const abi = interface.encodeABI();

  const res = await web3.eth.call({
    from: from,
    to: contract._address,
    data: abi,
    chain: CHAIN_NAME,
  });
  console.log(method, res);
  return res;
}

let accountAddress = "";
async function Connect() {
  running();
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  await switchNetworkCheck();
  web3 = new Web3(window.ethereum);

  window.ethereum.on("chainChanged", async (chainId) => {
    console.log("chain changed", chainId);
    if (chainId !== web3.utils.toHex(CHAIN_ID)) {
      window.location.reload();
      alert("点击确认切换到 " + CHAIN_NAME);
      await switchNetworkCheck();
    }
  });

  var account = document.getElementById("account");
  const accountsAddr = await web3.eth.requestAccounts();
  accountAddress = accountsAddr[0];
  account.innerHTML = "钱包: " + accountAddress + ` (${CHAIN_NAME})`;
  if (CHAIN_ID === 4) {
    account.innerHTML +=
      "<br/><small>※ 测试代币不够的话，每日可在各水龙头领 0.1 测试币</small>";
    account.innerHTML +=
      " <button onclick=\"window.open('https://goerlifaucet.com/','_blank')\">水龙头1</button>";
  }
  const $connectWallet = document.getElementById("connectWallet");
  $connectWallet.remove();

  const token = new web3.eth.Contract(tokenAbi(), TOKEN_ADDRESS);

  const decimals = await token.methods.decimals().call();
  const myTokenBalance = toDecial(
    await token.methods.balanceOf(accountAddress).call(),
    decimals
  );
  const totalSupply = toDecial(
    await token.methods.totalSupply().call(),
    decimals
  );
  const symbol = await token.methods.symbol().call();

  var tokens = document.getElementById("tokens");
  tokens.innerHTML = `<p>我的积分: ${myTokenBalance} $${symbol} <small>(占比 ${(
    Number(100 * myTokenBalance) / Number(totalSupply)
  ).toFixed(2)}%) 总发行: ${totalSupply} $${symbol}</small></p>`;

  if (myTokenBalance > 0) {
    const delegates = await token.methods.delegates(accountAddress).call();
    console.log("current delegates: ", delegates);

    let delegateAddress = "无";
    const noDelegates = delegates === ZERO_ADDRESS;
    if (!noDelegates) {
      delegateAddress = delegates;
      if (delegates === accountAddress) {
        delegateAddress = "自己";
      }
    }
    tokens.innerHTML += `<p style=\"font-size: 12px;\">投票代理人: ${delegateAddress}</p>`;

    let extra = "";

    const currentBlock = await web3.eth.getBlockNumber();
    const governor = new web3.eth.Contract(governorAbi(), GOVERNOR_ADDRESS);
    let getVotesWei = -1;
    for (var i = 1; i < 10; i++) {
      try {
        getVotesWei = await governor.methods
          .getVotes(accountAddress, currentBlock - i)
          .call();
        console.log("try getVotesWei from block", currentBlock - i);
      } catch (e) {
        console.error(e);
      }
      if (getVotesWei >= 0) break;
    }

    const getVotes = toDecial(getVotesWei, decimals);
    console.log({ getVotesWei, getVotes });
    if (getVotes > myTokenBalance) {
      if (delegates === accountAddress) {
        extra = `[代理: ${getVotes - myTokenBalance} $${symbol}]`;
      } else {
        extra = `[代理: ${getVotes} $${symbol}]`;
      }
    }
    const voteRatio = ` (${(
      Number(100 * getVotes) / Number(totalSupply)
    ).toFixed(2)} %)`;
    tokens.innerHTML += `<p style="font-size: 12px;">我的投票权: ${getVotes} $${symbol}${voteRatio} ${extra}</p>`;

    if (noDelegates) {
      tokens.innerHTML +=
        '<p style="color:red;">※ 未指定投票代理人的投票不会计入，请点击下方 "投票代理人变更"</p>';
      createNoDelegatesGovButtons();
    } else {
      createGovButtons();
    }
  } else {
    tokens.innerHTML += "<p>👏欢迎光临</p>";
  }

  done();
}

async function startViewProposals() {
  proposalOffset = 0;
  running();
  cleanLog();
  document.getElementById("createBudgetProposalForm").hidden = true;
  document.getElementById("createProposalForm").hidden = true;
  document.getElementById("createBatchMintProposalForm").hidden = true;
  document.getElementById("createGovernorProposalForm").hidden = true;
  document.getElementById("viewProposalsBlock").hidden = false;
  document.getElementById("governParametersBlock").hidden = true;
  document.getElementById("setDelegatesBlock").hidden = true;
  document.getElementById("viewHoldersBlock").hidden = true;
  document.getElementById("checkProposalBlock").hidden = true;
  await initViewProposals(true);
  done();
}

function startCreateBudgetProposal() {
  running();
  cleanLog();
  document.getElementById("createBudgetProposalForm").hidden = false;
  document.getElementById("createProposalForm").hidden = true;
  document.getElementById("createBatchMintProposalForm").hidden = true;
  document.getElementById("createGovernorProposalForm").hidden = true;
  document.getElementById("viewProposalsBlock").hidden = true;
  document.getElementById("governParametersBlock").hidden = true;
  document.getElementById("setDelegatesBlock").hidden = true;
  document.getElementById("viewHoldersBlock").hidden = true;
  document.getElementById("checkProposalBlock").hidden = true;
  initCreateBudgetProposal(true);
  done();
}

function startCreateProposal() {
  running();
  cleanLog();
  document.getElementById("createBudgetProposalForm").hidden = true;
  document.getElementById("createProposalForm").hidden = false;
  document.getElementById("createBatchMintProposalForm").hidden = true;
  document.getElementById("createGovernorProposalForm").hidden = true;
  document.getElementById("viewProposalsBlock").hidden = true;
  document.getElementById("governParametersBlock").hidden = true;
  document.getElementById("setDelegatesBlock").hidden = true;
  document.getElementById("viewHoldersBlock").hidden = true;
  document.getElementById("checkProposalBlock").hidden = true;
  initCreateProposal(true);
  done();
}

function startCreateBatchMintProposal() {
  running();
  cleanLog();
  document.getElementById("createBudgetProposalForm").hidden = true;
  document.getElementById("createProposalForm").hidden = true;
  document.getElementById("createBatchMintProposalForm").hidden = false;
  document.getElementById("createGovernorProposalForm").hidden = true;
  document.getElementById("viewProposalsBlock").hidden = true;
  document.getElementById("governParametersBlock").hidden = true;
  document.getElementById("setDelegatesBlock").hidden = true;
  document.getElementById("viewHoldersBlock").hidden = true;
  document.getElementById("checkProposalBlock").hidden = true;
  initCreateBatchMintProposal(true);
  done();
}

function startGovernorProposal() {
  running();
  cleanLog();
  document.getElementById("createBudgetProposalForm").hidden = true;
  document.getElementById("createProposalForm").hidden = true;
  document.getElementById("createBatchMintProposalForm").hidden = true;
  document.getElementById("createGovernorProposalForm").hidden = false;
  document.getElementById("viewProposalsBlock").hidden = true;
  document.getElementById("governParametersBlock").hidden = true;
  document.getElementById("setDelegatesBlock").hidden = true;
  document.getElementById("viewHoldersBlock").hidden = true;
  document.getElementById("checkProposalBlock").hidden = true;
  initCreateGovernorProposal(true);
  done();
}

async function delegateOther() {
  running();
  await delegate(
    document.getElementById("delegateOtherAddress").value.replace(/\s/g, "")
  );
  done();
}

async function delegate(delegateAddress) {
  running();
  web3 = new Web3(window.ethereum);
  const token = new web3.eth.Contract(tokenAbi(), TOKEN_ADDRESS);
  const accountsAddr = await web3.eth.requestAccounts();
  const accountAddress = accountsAddr[0];

  const gasPrice = await web3.eth.getGasPrice();
  const gasEstimate = await token.methods
    .delegate(delegateAddress)
    .estimateGas({ from: accountAddress, gas: 50000000 });
  console.log("gasEstimate: " + gasEstimate);
  console.log("gasPrice: " + gasPrice);

  var setDelegatesBlock = document.getElementById("setDelegatesBlock");

  var log = document.createElement("div");
  log.setAttribute("id", "delegate_log");
  setDelegatesBlock.appendChild(log);

  const results = await token.methods
    .delegate(delegateAddress)
    .call({ from: accountAddress }, (error) =>
      printErrorLog(error, "delegate_log")
    );
  console.log("delegate result: " + results);

  log.style.color = "";
  log.innerHTML = "<p>上链中 ...</p>";

  let transactionHash = "<none>";
  let error = null;
  const tx = await token.methods
    .delegate(delegateAddress)
    .send(
      {
        from: accountAddress,
        gas: gasEstimate,
        gasPrice,
      },
      (error, hash) => {
        printErrorLog(error, "delegate_log");
        transactionHash = hash;
        console.log("hash:", hash);
      }
    )
    .catch((sendError) => {
      error = sendError;
      console.log(sendError);
    });

  if (error) {
    await cleanUpSetDelegates(true);
    return;
  }
  log = document.getElementById("delegate_log");
  const delegates = await token.methods.delegates(accountAddress).call();
  let newDelegateAddress = delegates;
  if (delegates === accountAddress) {
    newDelegateAddress = `自己 (${delegates})`;
  }
  if (delegates === ZERO_ADDRESS) {
    newDelegateAddress = "无";
  }
  log.style.color = "";
  log.innerHTML =
    "<p>变更成功!</p><p>新投票代理人地址: " +
    newDelegateAddress +
    "</p>" +
    '<a href="' +
    ETHERSCAN_URL +
    "tx/" +
    transactionHash +
    '" style="color:#59bfcf;" target="_blank">' +
    ETHERSCAN_URL +
    "tx/" +
    transactionHash +
    "</a>" +
    '<br/>请刷新页面：<a style="color: #1bff69" href=".">刷新</a>';
  await cleanUpSetDelegates(true);
  done();
}

function getHolder(holders, addr) {
  return holders.find((h) => {
    return h.address.toLowerCase() == addr.toLowerCase();
  });
}

function getShortAddress(addr) {
  return addr.slice(0, 5) + "..." + addr.slice(addr.length - 5, addr.length);
}

async function updateHolderName() {
  web3 = new Web3(window.ethereum);
  const accountsAddr = await web3.eth.requestAccounts();
  const address = accountsAddr[0];
  const holders = await getHolders();
  const holder = getHolder(holders, address);

  var holderNameUpdate = document.getElementById("holderNameUpdate");
  var newHolderNameInput = document.getElementById("newHolderNameInput");
  var newHolderNameButton = document.getElementById("newHolderNameButton");

  const newHolderName = document.getElementById("newHolderNameInput").value;
  if (
    newHolderName.replace(/\s/g, "").replace(/(\r\n|\n|\r)/gm, "") != "" &&
    newHolderName != holder.name
  ) {
    newHolderNameInput.disabled = true;
    newHolderNameButton.disabled = true;
    const ret = await fetch(`${SERVER_URL}/api/holder/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        name: newHolderName,
      }),
    });
    const data = await ret.json();
    console.log("ret:::", ret);
    console.log("error:::", data.error);
    if (data.message == "success") {
      newHolderNameInput.removeAttribute("disabled");
      newHolderNameButton.removeAttribute("disabled");
      initViewHolders(true);
    } else if (data.message == "Holder name already exists.") {
      newHolderNameInput.removeAttribute("disabled");
      newHolderNameButton.removeAttribute("disabled");
      holderNameUpdate.innerHTML += `<font color=\"red\">'${newHolderName}' 此名字已存在，请换一个名字</font><br/><br/>`;
    }
  } else {
  }
}

async function initHolderNameUpdate(viewHoldersBlock, holders, address) {
  const holder = getHolder(holders, address);
  console.log("uuu holders::", holders);
  console.log("uuu address::", address);
  console.log("uuu holder::", holder);
  var holderNameUpdate = document.createElement("div");
  holderNameUpdate.setAttribute("id", "holderNameUpdate");
  viewHoldersBlock.appendChild(holderNameUpdate);
  if (
    holder === undefined ||
    holder.name === undefined ||
    holder.name === null
  ) {
    holderNameUpdate.innerHTML =
      '<span>我的名字:&nbsp;<input type="text" disabled></input>&nbsp;<button disabled>更新</button>&nbsp;(你没有积分)</span><br/><br/>';
  } else {
    holderNameUpdate.innerHTML = `<span>我的名字:&nbsp;<input id=\"newHolderNameInput\" type=\"text\" value=\"${holder.name}\"></input>&nbsp;<button id=\"newHolderNameButton\" onclick=\"updateHolderName()\">更新</button></span><br/><br/>`;
  }
}

function getHolderNameColor(name) {
  return `<font color=\"cccccc\">${name}</font>`;
}

async function initViewHolders(cleanup) {
  running();
  var viewHoldersBlock = document.getElementById("viewHoldersBlock");
  viewHoldersBlock.innerHTML = "<h3>持有者列表</h3>";

  web3 = new Web3(window.ethereum);
  const accountsAddr = await web3.eth.requestAccounts();
  const accountAddress = accountsAddr[0];

  const holders = await getHolders();
  await initHolderNameUpdate(viewHoldersBlock, holders, accountAddress);

  const governor = new web3.eth.Contract(governorAbi(), GOVERNOR_ADDRESS);
  const token = new web3.eth.Contract(tokenAbi(), TOKEN_ADDRESS);
  const symbol = await token.methods.symbol().call();
  const currentBlock = await web3.eth.getBlockNumber();
  const decimals = web3.utils.toBN(await token.methods.decimals().call());
  const totalSupplyWei = await token.methods.totalSupply().call();
  const totalSupply = web3.utils.fromWei(totalSupplyWei, "ether");

  console.log("holders::", holders);
  g_holders = [];
  for (var i = 0; i < holders.length; i++) {
    const addr = holders[i].address;
    let name = holders[i].name;
    if (name === "") name = getShortAddress(addr);
    else name = getHolderNameColor(name);
    const holderTokensWei = await token.methods.balanceOf(addr).call();
    const delegatee = await token.methods.delegates(addr).call();
    const delegateeHolder = getHolder(holders, delegatee);
    console.log("delegatee::", delegatee);
    let delegateeName = getShortAddress(delegatee);
    if (delegateeHolder !== undefined && typeof delegateeHolder == "object") {
      if ("name" in delegateeHolder) {
        if (delegateeHolder.name != "")
          delegateeName = getHolderNameColor(delegateeHolder.name);
      }
    }
    if (addr === delegatee) delegateeName = "自己";
    if (delegatee == ZERO_ADDRESS) delegateeName = "未设置";

    let getVotesWei = -1;
    for (var vi = 0; vi < 50; vi++) {
      try {
        getVotesWei = await governor.methods
          .getVotes(addr, currentBlock - vi)
          .call();
      } catch (e) {}
      if (getVotesWei >= 0) break;
    }
    console.log("holder getVotesWei::", getVotesWei);
    const holderVotes = web3.utils.fromWei(getVotesWei, "ether");
    const holderTokens = web3.utils.fromWei(holderTokensWei, "ether");
    console.log("holder tokens::", holderTokens);
    console.log("holder votes::", holderVotes);
    const holderTokensRatio =
      (100 * Number(holderTokens)) / Number(totalSupply);
    const holderVotesRatio = (100 * Number(holderVotes)) / Number(totalSupply);

    if (delegateeName === "") delegateeName = getShortAddress(delegatee);

    g_holders.push({
      name,
      delegateeName,
      holderTokens,
      holderTokensRatio,
      holderVotes,
      holderVotesRatio,
      address: addr,
      delegatee,
    });
  }

  function compare(a, b) {
    if (Number(a.holderTokens) > Number(b.holderTokens)) {
      return -1;
    }
    if (Number(a.holderTokens) < Number(b.holderTokens)) {
      return 1;
    }
    return 0;
  }

  g_holders.sort(compare);

  var holdersTable = document.createElement("table");
  holdersTable.setAttribute("id", "holdersTable");
  viewHoldersBlock.appendChild(holdersTable);
  holdersTable = document.getElementById("holdersTable");
  holdersTable.style = "text-align: right;";
  viewHoldersBlock.removeChild(document.getElementById("holdersTable"));
  holdersTable = document.createElement("table");
  holdersTable.setAttribute("id", "holdersTable");
  viewHoldersBlock.appendChild(holdersTable);
  holdersTable = document.getElementById("holdersTable");
  holdersTable.style = "text-align: right;";
  const thead = holdersTable.createTHead();
  const thRow = thead.insertRow();
  thRow.style = "text-align: center;";
  thRow.insertCell().innerText = "持有人";
  thRow.insertCell().innerText = "投票代理人";
  thRow.insertCell().innerText = "积分";
  thRow.insertCell().innerText = "";
  thRow.insertCell().innerText = "投票权";
  thRow.insertCell().innerText = "";
  thRow.insertCell().innerText = "持有人地址";
  thRow.insertCell().innerText = "投票代理人地址";
  const tbody = holdersTable.createTBody();

  g_holders.forEach((h) => {
    const thRow = tbody.insertRow();
    console.log("h.delegateeName::", h.delegateeName);
    let delegateeName = h.delegateeName;
    if (delegateeName === "") delegateeName = getShortAddress(h.delegatee);
    thRow.insertCell().innerHTML = h.name + " | ";
    thRow.insertCell().innerHTML = delegateeName + " | ";
    thRow.insertCell().innerText = h.holderTokens.toString() + " | ";
    thRow.insertCell().innerText = `${h.holderTokensRatio.toFixed(2)}% | `;
    thRow.insertCell().innerText = h.holderVotes.toString() + " | ";
    thRow.insertCell().innerText = `${h.holderVotesRatio.toFixed(2)}% | `;
    thRow.insertCell().innerText = getShortAddress(h.address) + " | ";
    thRow.insertCell().innerText = getShortAddress(h.delegatee);
  });

  viewHoldersBlock.innerHTML +=
    '<br/><small><font color="gray">∎</font></small>';

  cleanUpViewHolders(cleanup);
  done();
}

async function startViewHolders() {
  running();
  cleanLog();
  document.getElementById("createBudgetProposalForm").hidden = true;
  document.getElementById("createProposalForm").hidden = true;
  document.getElementById("createBatchMintProposalForm").hidden = true;
  document.getElementById("createGovernorProposalForm").hidden = true;
  document.getElementById("viewProposalsBlock").hidden = true;
  document.getElementById("governParametersBlock").hidden = true;
  document.getElementById("setDelegatesBlock").hidden = true;
  document.getElementById("viewHoldersBlock").hidden = false;
  document.getElementById("checkProposalBlock").hidden = true;
  await initViewHolders(true);
}

async function startCheckProposal() {
  running();
  cleanLog();
  document.getElementById("createBudgetProposalForm").hidden = true;
  document.getElementById("createProposalForm").hidden = true;
  document.getElementById("createBatchMintProposalForm").hidden = true;
  document.getElementById("createGovernorProposalForm").hidden = true;
  document.getElementById("viewProposalsBlock").hidden = true;
  document.getElementById("governParametersBlock").hidden = true;
  document.getElementById("setDelegatesBlock").hidden = true;
  document.getElementById("viewHoldersBlock").hidden = true;
  document.getElementById("checkProposalBlock").hidden = false;
  await initCheckProposal(true);
}

async function startSetDelegates() {
  running();
  cleanLog();
  document.getElementById("createBudgetProposalForm").hidden = true;
  document.getElementById("createProposalForm").hidden = true;
  document.getElementById("createBatchMintProposalForm").hidden = true;
  document.getElementById("createGovernorProposalForm").hidden = true;
  document.getElementById("viewProposalsBlock").hidden = true;
  document.getElementById("governParametersBlock").hidden = true;
  document.getElementById("setDelegatesBlock").hidden = false;
  document.getElementById("viewHoldersBlock").hidden = true;
  document.getElementById("checkProposalBlock").hidden = true;
  await initSetDelegates(true);

  var setDelegatesBlock = document.getElementById("setDelegatesBlock");

  web3 = new Web3(window.ethereum);
  const token = new web3.eth.Contract(tokenAbi(), TOKEN_ADDRESS);
  const accountsAddr = await web3.eth.requestAccounts();
  const accountAddress = accountsAddr[0];
  const delegates = await token.methods.delegates(accountAddress).call();
  const holders = await getHolders();
  const delegateHolder = getHolder(holders, delegates);
  let delegateAddress = delegates;
  if (delegateHolder !== undefined && typeof delegateHolder == "object") {
    if ("name" in delegateHolder) {
      if (delegateHolder.name !== "") {
        delegateAddress =
          getHolderNameColor(delegateHolder.name) + ` (${delegates})`;
      }
    }
  }
  if (delegates === ZERO_ADDRESS) {
    delegateAddress = "无";
  }
  if (delegates === accountAddress) {
    delegateAddress = `自己 (${accountAddress})`;
  }

  if (delegates !== accountAddress) {
    var selfDelegate = document.createElement("button");
    selfDelegate.setAttribute("id", "selfDelegate");
    selfDelegate.textContent = "自我代理";
    selfDelegate.onclick = () => delegate(accountAddress);
    setDelegatesBlock.appendChild(selfDelegate);
    setDelegatesBlock.appendChild(document.createTextNode(" "));
  }

  var nowDelegates = document.createElement("p");
  nowDelegates.setAttribute("id", "nowDelegates");
  nowDelegates.innerHTML = `当前投票代理人: ${delegateAddress}`;
  setDelegatesBlock.appendChild(nowDelegates);

  var delegateOther = document.createElement("div");
  delegateOther.innerHTML =
    '<span>代理人地址:&nbsp;<input id="delegateOtherAddress" type="text" />&nbsp;<button onclick="delegateOther()">指定代理人</button></span><br/>';

  setDelegatesBlock.appendChild(delegateOther);
  done();
}

async function startGovernParameters() {
  running();
  cleanLog();
  document.getElementById("createBudgetProposalForm").hidden = true;
  document.getElementById("createProposalForm").hidden = true;
  document.getElementById("createBatchMintProposalForm").hidden = true;
  document.getElementById("viewProposalsBlock").hidden = true;
  document.getElementById("governParametersBlock").hidden = false;
  document.getElementById("setDelegatesBlock").hidden = true;
  document.getElementById("viewHoldersBlock").hidden = true;
  document.getElementById("checkProposalBlock").hidden = true;
  await initGovernParameters(true);
  done();
}

function createNoDelegatesGovButtons() {
  running();
  const setDelegates = document.getElementById("setDelegates");
  setDelegates.hidden = false;
  done();
}

function createGovButtons() {
  running();
  const createBudgetProposal = document.getElementById("createBudgetProposal");
  const createProposal = document.getElementById("createProposal");
  const createBatchMintProposal = document.getElementById(
    "createBatchMintProposal"
  );
  const createGovernorProposal = document.getElementById(
    "createGovernorProposal"
  );
  const viewProposals = document.getElementById("viewProposals");
  const governParameters = document.getElementById("governParameters");
  const setDelegates = document.getElementById("setDelegates");
  const viewHolders = document.getElementById("viewHolders");
  const checkProposal = document.getElementById("checkProposal");
  createBudgetProposal.hidden = false;
  createProposal.hidden = false;
  createBatchMintProposal.hidden = false;
  createGovernorProposal.hidden = false;
  viewProposals.hidden = false;
  governParameters.hidden = false;
  setDelegates.hidden = false;
  viewHolders.hidden = false;
  checkProposal.hidden = false;
  done();
}

function addToken2Wallet() {
  const tokenAddress = TOKEN_ADDRESS;
  const tokenSymbol = TOKEN_SYMBOL;
  const tokenDecimals = TOKEN_DECIMALS;
  const tokenImage = "https://dao.poemwiki.com/favicon.ico";
  if (typeof window.ethereum !== "undefined") {
    const params = {
      type: "ERC20",
      options: {
        address: tokenAddress,
        symbol: tokenSymbol,
        decimals: tokenDecimals,
        image: tokenImage,
      },
    };

    console.log({ params });
    const method = "wallet_watchAsset";
    window.ethereum
      .request({
        method,
        params,
      })
      .catch((error) => {
        console.error(error);
      });
  } else {
    alert("暂不支持此钱包");
  }
}

Connect();
