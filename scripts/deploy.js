async function main() {
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
