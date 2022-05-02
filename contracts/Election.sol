//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "hardhat/console.sol";

struct ElectionItem {
    string description;
    uint256 endOfElection;
    address currentLeader;
    uint256 currentLeaderVotes;
    uint256 balance;
    address[] candidates;
}

struct VotesForCandidate {
    uint256 num;
    bool isExist;
}

contract Election {
    address public owner;
    ElectionItem[] public electionsList;
    mapping(uint256 => mapping(address => VotesForCandidate))
        public electionIdToCandidatesToVotesNum;
    mapping(uint256 => mapping(address => bool)) public electionIdToVotedAddrs;
    uint256 public balanceOfFee;

    uint256 constant duration = 3 * 24 * 60 * 60; // sec in 3 days
    uint256 constant costOfVoting = 0.01 ether;
    uint256 constant feePercent = 10;

    constructor() {
        owner = msg.sender;
    }

    function createElection(
        address[] calldata candidates,
        string calldata description
    )
        external
        isOwner()
    {
        require(candidates.length > 0, "Not enough candidates");

        ElectionItem memory electionItem = ElectionItem({
            description: description,
            endOfElection: block.timestamp + duration,
            currentLeader: candidates[0],
            currentLeaderVotes: 0,
            balance: 0,
            candidates: candidates
        });

        for(uint256 i = 0; i < candidates.length; i++) {
            electionIdToCandidatesToVotesNum[electionsList.length][candidates[i]] = VotesForCandidate({
                num: 0,
                isExist: true
            });
        }
        electionsList.push(electionItem);
    }

    function vote(uint256 electionId, address candidate)
        external
        payable
        electionExists(electionId)
    {
        require(msg.value == costOfVoting, "Incorrect amount");

        ElectionItem memory electionItem = electionsList[electionId];
        require(
            block.timestamp < electionItem.endOfElection,
            "Election is over"
        );

        require(
            !electionIdToVotedAddrs[electionId][msg.sender],
            "Address've already voted"
        );
        require(electionIdToCandidatesToVotesNum[electionId][candidate].isExist, "Candidate doesn't exist");
        electionIdToVotedAddrs[electionId][msg.sender] = true;

        uint256 votesNum = ++electionIdToCandidatesToVotesNum[electionId][
            candidate
        ].num;
        if (electionItem.currentLeaderVotes < votesNum) {
            electionItem.currentLeaderVotes = votesNum;
            electionItem.currentLeader = candidate;
        }
        electionItem.balance = msg.value;
        electionsList[electionId] = electionItem;
    }

    function finishElection(uint256 electionId)
        external
        electionExists(electionId)
    {
        ElectionItem memory electionItem = electionsList[electionId];
        require(
            block.timestamp >= electionItem.endOfElection,
            "Election is still ongoing"
        );
        uint256 balance = electionItem.balance;
        electionItem.balance = 0; // avoid reentrancy
        electionsList[electionId] = electionItem;

        balanceOfFee += balance * feePercent / 100;
        payable(electionItem.currentLeader).transfer(
            balance * (100 - feePercent) / 100
        );
    }

    function getElectionInfo(uint256 electionId)
        public
        view
        electionExists(electionId)
        returns (ElectionItem memory)
    {
        return electionsList[electionId];
    }

    function sendFeeToOwner() public isOwner {
        payable(owner).transfer(balanceOfFee);
        balanceOfFee = 0;
    }

    modifier isOwner() {
        require(msg.sender == owner, "Access denied");
        _;
    }

    modifier electionExists(uint256 electionId) {
        require(electionId < electionsList.length, "Election doesn't exist");
        _;
    }
}
