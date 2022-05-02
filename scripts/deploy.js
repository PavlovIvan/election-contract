async function main() {
    const [owner] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", owner.address);

    const Election = await ethers.getContractFactory("Election");
    const hardhatElection = await Election.deploy();

    await hardhatElection.deployed();

    console.log("Election deployed to: ", hardhatElection.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
