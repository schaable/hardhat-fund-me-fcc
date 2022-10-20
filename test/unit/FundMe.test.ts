import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { Address } from "hardhat-deploy/dist/types";
import { FundMe, MockV3Aggregator } from "../../typechain-types";
import { assert, expect } from "chai";
import { developmentChains } from "../../helper.hardhat.config";

!developmentChains.includes(network.config.chainId!)
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe: FundMe;
      let mockV3Aggregator: MockV3Aggregator;
      let deployer: Address;
      const sendValue = ethers.utils.parseEther("1");

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture("all");
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
      });

      describe("constructor", async function () {
        it("sets the aggregator addresses correctly", async function () {
          const response = await fundMe.getPriceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });

      describe("fund", async function () {
        it("fails if you don't send enough ETH", async function () {
          await expect(fundMe.fund()).to.be.revertedWith("You need to spend more ETH!");
        });

        it("updates the amount funded data structure", async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });

        it("add funder to array of funders", async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getFunder(0);
          assert.equal(response, deployer);
        });
      });

      describe("withdraw", async function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue });
        });

        it("withdraw ETH from a single founder", async function () {
          const startingFundMeBalance = await ethers.provider.getBalance(fundMe.address);
          const startingDeployerBalance = await ethers.provider.getBalance(deployer);

          const transactionResponse = await fundMe.withdraw();
          const { gasUsed, effectiveGasPrice } = await transactionResponse.wait(1);
          const totalGasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await ethers.provider.getBalance(fundMe.address);
          const endingDeployerBalance = await ethers.provider.getBalance(deployer);

          assert.isOk(endingFundMeBalance.eq(0));
          assert.isOk(startingFundMeBalance.add(startingDeployerBalance).eq(endingDeployerBalance.add(totalGasCost)));
        });

        it("allows us to withdraw with multiple founders", async function () {
          const accounts = await ethers.getSigners();
          for (let i = 1; i < accounts.length; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }

          const startingFundMeBalance = await ethers.provider.getBalance(fundMe.address);
          const startingDeployerBalance = await ethers.provider.getBalance(deployer);

          const transactionResponse = await fundMe.withdraw();
          const { gasUsed, effectiveGasPrice } = await transactionResponse.wait(1);
          const totalGasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await ethers.provider.getBalance(fundMe.address);
          const endingDeployerBalance = await ethers.provider.getBalance(deployer);

          assert.isOk(endingFundMeBalance.eq(0));
          assert.isOk(startingFundMeBalance.add(startingDeployerBalance).eq(endingDeployerBalance.add(totalGasCost)));

          // Make sure the funders are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted;
          for (let i = 1; i < accounts.length; i++) {
            assert.isOk((await fundMe.getAddressToAmountFunded(accounts[i].address)).eq(0));
          }
        });

        it("only allows the owner to withdraw", async function () {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = await fundMe.connect(attacker);
          await expect(attackerConnectedContract.withdraw()).to.be.revertedWithCustomError(
            attackerConnectedContract,
            "FundMe__NotOwner"
          );
        });
      });

      describe("cheaper withdraw", async function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue });
        });

        it("withdraw ETH from a single founder", async function () {
          const startingFundMeBalance = await ethers.provider.getBalance(fundMe.address);
          const startingDeployerBalance = await ethers.provider.getBalance(deployer);

          const transactionResponse = await fundMe.cheaperWithdraw();
          const { gasUsed, effectiveGasPrice } = await transactionResponse.wait(1);
          const totalGasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await ethers.provider.getBalance(fundMe.address);
          const endingDeployerBalance = await ethers.provider.getBalance(deployer);

          assert.isOk(endingFundMeBalance.eq(0));
          assert.isOk(startingFundMeBalance.add(startingDeployerBalance).eq(endingDeployerBalance.add(totalGasCost)));
        });

        it("allows us to withdraw with multiple founders", async function () {
          const accounts = await ethers.getSigners();
          for (let i = 1; i < accounts.length; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }

          const startingFundMeBalance = await ethers.provider.getBalance(fundMe.address);
          const startingDeployerBalance = await ethers.provider.getBalance(deployer);

          const transactionResponse = await fundMe.cheaperWithdraw();
          const { gasUsed, effectiveGasPrice } = await transactionResponse.wait(1);
          const totalGasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await ethers.provider.getBalance(fundMe.address);
          const endingDeployerBalance = await ethers.provider.getBalance(deployer);

          assert.isOk(endingFundMeBalance.eq(0));
          assert.isOk(startingFundMeBalance.add(startingDeployerBalance).eq(endingDeployerBalance.add(totalGasCost)));

          // Make sure the funders are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted;
          for (let i = 1; i < accounts.length; i++) {
            assert.isOk((await fundMe.getAddressToAmountFunded(accounts[i].address)).eq(0));
          }
        });

        it("only allows the owner to withdraw", async function () {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = await fundMe.connect(attacker);
          await expect(attackerConnectedContract.cheaperWithdraw()).to.be.revertedWithCustomError(
            attackerConnectedContract,
            "FundMe__NotOwner"
          );
        });
      });
    });
