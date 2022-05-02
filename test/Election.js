const { expect } = require("chai");

describe("Election contract", function () {

    let Election;
    let hardhatElection;
    let owner;
    let voters;
    let candidates;
    let signers;
    let description = "text description of election";

    beforeEach(async function () {
        Election = await ethers.getContractFactory("Election");
        [owner, ...signers] = await ethers.getSigners();

        voters = signers.slice(1, 6);
        candidates = signers.slice(6, 10);
        candidatesAddrs = candidates.map(c => c.address)

        hardhatElection = await Election.deploy();

        await hardhatElection.deployed();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await hardhatElection.owner()).to.equal(owner.address);
        });
    });

    describe("Creation election", function () {

        it("Should fail if sender is not owner", async function () {
            await expect(
                hardhatElection.connect(voters[0]).createElection(candidatesAddrs, description)
            ).to.be.revertedWith("Access denied");
        });

        it("Should fail if candidates list is empty", async function () {
            await expect(
                hardhatElection.connect(owner).createElection([], description)
            ).to.be.revertedWith("Not enough candidates");
        });

        it("Should create election", async function () {
            await hardhatElection.connect(owner).createElection(candidatesAddrs, description);

            const timestamp = (await ethers.provider.getBlock("latest"))["timestamp"];
            const curElection = await hardhatElection.getElectionInfo(0);

            expect(curElection.endOfElection).to.equal(timestamp + 3 * 24 * 60 * 60);
            expect(curElection.candidates).to.eql(candidatesAddrs);
            expect(curElection.description).to.equal(description);
        });
    });

    describe("Voting for candidate", function () {
        it("Should fail if not enough tokens", async function () {
            await hardhatElection.connect(owner).createElection(candidatesAddrs, description);

            await expect(
                hardhatElection.connect(voters[0]).vote(0, candidatesAddrs[0])
            ).to.be.revertedWith("Incorrect amount");
        });

        it("Should fail if user 've already vated", async function () {
            await hardhatElection.connect(owner).createElection(candidatesAddrs, description);

            await hardhatElection.connect(voters[0]).vote(0, candidatesAddrs[0], {
                value: ethers.utils.parseEther("0.01")
            });

            await expect(
                hardhatElection.connect(voters[0]).vote(0, candidatesAddrs[1], {
                    value: ethers.utils.parseEther("0.01")
                })).to.be.revertedWith("Address've already voted");
        });

        it("Should fail if election doesn't exist", async function () {
            await expect(
                hardhatElection.connect(voters[0]).vote(0, candidatesAddrs[0], {
                    value: ethers.utils.parseEther("0.01")
                })).to.be.revertedWith("Election doesn't exist");
        });

        it("Should fail if candidate doesn't exist", async function () {
            await hardhatElection.connect(owner).createElection(candidatesAddrs, description);

            await expect(
                hardhatElection.connect(voters[0]).vote(0, voters[0].address, {
                    value: ethers.utils.parseEther("0.01")
                })).to.be.revertedWith("Candidate doesn't exist");
        });

        it("Should fail if election is over", async function () {
            await hardhatElection.connect(owner).createElection(candidatesAddrs, description);

            await network.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);

            await expect(
                hardhatElection.connect(voters[0]).vote(0, candidatesAddrs[0], {
                    value: ethers.utils.parseEther("0.01")
                })).to.be.revertedWith("Election is over");
        });

        it("Should vote if happy pass", async function () {
            await hardhatElection.connect(owner).createElection(candidatesAddrs, description);

            await hardhatElection.connect(voters[0]).vote(0, candidatesAddrs[2], {
                value: ethers.utils.parseEther("0.01")
            });

            let curElection = await hardhatElection.getElectionInfo(0);

            expect(curElection.currentLeader).to.equal(candidatesAddrs[2]);
            expect(curElection.currentLeaderVotes).to.equal(1);
            expect(curElection.balance).to.equal(ethers.utils.parseEther("0.01"));

            await hardhatElection.connect(voters[1]).vote(0, candidatesAddrs[1], {
                value: ethers.utils.parseEther("0.01")
            });
            await hardhatElection.connect(voters[2]).vote(0, candidatesAddrs[1], {
                value: ethers.utils.parseEther("0.01")
            });
            curElection = await hardhatElection.getElectionInfo(0);
            expect(curElection.currentLeader).to.equal(candidatesAddrs[1]);
            expect(curElection.currentLeaderVotes).to.equal(2);
            expect(curElection.balance).to.equal(ethers.utils.parseEther("0.01"));
        });
    });

    describe("End election", function () {
        it("Should fail if election is still going", async function () {
            await hardhatElection.connect(owner).createElection(candidatesAddrs, description);

            await expect(
                hardhatElection.connect(voters[0]).finishElection(0)
            ).to.be.revertedWith("Election is still ongoing");;
        })

        it("Should fail if election doesn't exist", async function () {
            await expect(
                hardhatElection.connect(voters[0]).finishElection(0)
            ).to.be.revertedWith("Election doesn't exist");
        });

        it("Should end election if happy pass", async function () {
            await hardhatElection.connect(owner).createElection(candidatesAddrs, description);

            await hardhatElection.connect(voters[0]).vote(0, candidatesAddrs[2], {
                value: ethers.utils.parseEther("0.01")
            });

            await network.provider.send("evm_increaseTime", [3 * 24 * 60 * 60])

            const startBalance = await ethers.provider.getBalance(candidatesAddrs[2]);
            await hardhatElection.connect(voters[0]).finishElection(0);

            expect(
                await ethers.provider.getBalance(candidatesAddrs[2])
            ).to.equal(startBalance.add(ethers.utils.parseEther("0.009")));

            expect(await hardhatElection.balanceOfFee()).to.equal(ethers.utils.parseEther("0.001"));
            expect(await ethers.provider.getBalance(hardhatElection.address)).to.equal(ethers.utils.parseEther("0.001"));
        });
    });

    describe("Send fee to owner", function () {
        it("Should fail if sender is not owner", async function () {
            await expect(
                hardhatElection.connect(voters[0]).sendFeeToOwner()
            ).to.be.revertedWith("Access denied");
        });

        it("Should send fee to owner if happy pass", async function () {
            await hardhatElection.connect(owner).createElection(candidatesAddrs, description);

            await hardhatElection.connect(voters[0]).vote(0, candidatesAddrs[2], {
                value: ethers.utils.parseEther("0.01")
            });

            await network.provider.send("evm_increaseTime", [3 * 24 * 60 * 60])
            await hardhatElection.connect(voters[0]).finishElection(0);

            const startBalance = await ethers.provider.getBalance(owner.address);
            expect(await hardhatElection.balanceOfFee()).to.equal(ethers.utils.parseEther("0.001"));
            expect(await ethers.provider.getBalance(hardhatElection.address)).to.equal(ethers.utils.parseEther("0.001"));

            await hardhatElection.connect(owner).sendFeeToOwner();

            const diff = (await ethers.provider.getBalance(owner.address)).sub(startBalance);
            expect(diff.gt(ethers.utils.parseEther("0.0009"))).to.be.true;
            expect(diff.lt(ethers.utils.parseEther("0.001"))).to.be.true; // due to gas cost

            expect(await hardhatElection.balanceOfFee()).to.equal(ethers.utils.parseEther("0.0"));
            expect(await ethers.provider.getBalance(hardhatElection.address)).to.equal(ethers.utils.parseEther("0.0"));
        });
    });
});
