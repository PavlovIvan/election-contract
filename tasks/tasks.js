require("@nomiclabs/hardhat-web3");

const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const url = "https://eth-rinkeby.alchemyapi.io/v2/xa4Zaq1l2TaOXClfwf65iZxBt-HeH2b7";
//const provider = new ethers.providers.JsonRpcProvider(url);

task("get-accounts", "Get accounts")
    .setAction(async (taskArgs) => {
        console.log((await ethers.getSigners()).map(c => c.address));
    });

task("get-election-info", "Get election info")
    .addParam("account", "From")
    .addParam("id", "Election id")
    .setAction(async (taskArgs) => {
        const account = await ethers.getSigner(taskArgs.account);
        const deployedElection = await initContract(account);
        console.log(await deployedElection.getElectionInfo(taskArgs.id));
    });

task("create-election", "Create election")
    .addParam("account", "From")
    .addParam("description", "Description")
    .addVariadicPositionalParam("candidates", "list of candidates")
    .setAction(async function (taskArgs) {
        const account = await ethers.getSigner(taskArgs.account);
        const deployedElection = await initContract(account);
        console.log(await deployedElection.createElection(taskArgs.candidates, taskArgs.description));
    });

task("vote", "vote in election")
    .addParam("account", "From")
    .addParam("id", "Election id")
    .addParam("candidate", "Candidate")
    .setAction(async function (taskArgs) {
        const account = await ethers.getSigner(taskArgs.account);
        const deployedElection = await initContract(account);
        console.log(await deployedElection.vote(taskArgs.id, taskArgs.candidate, {
            value: ethers.utils.parseEther("0.01")
        }));
    });

task("finish-election", "Get election info")
    .addParam("account", "From")
    .addParam("id", "Election id")
    .setAction(async (taskArgs) => {
        const account = await ethers.getSigner(taskArgs.account);
        const deployedElection = await initContract(account);
        console.log(await deployedElection.finishElection(taskArgs.id));
    });

async function initContract(account) {
    const Election = await ethers.getContractFactory("Election");
    return await new ethers.Contract(contractAddress, Election.interface, account);
}
