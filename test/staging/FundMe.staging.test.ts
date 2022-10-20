import { ethers, getNamedAccounts, network } from "hardhat";
import { Address } from "hardhat-deploy/dist/types";
import { FundMe } from "../../typechain-types";
import { developmentChains } from "../../helper.hardhat.config";
import { assert } from "chai";

developmentChains.includes(network.config.chainId!)
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe: FundMe;
      let deployer: Address;
      const sendValue = ethers.utils.parseEther("0.04");

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        fundMe = await ethers.getContract("FundMe", deployer);
      });

      it("allows people to fund and withdraw", async () => {
        await fundMe.fund({ value: sendValue });
        await fundMe.withdraw();
        const endingFundMeBalance = await ethers.provider.getBalance(fundMe.address);
        assert.isOk(endingFundMeBalance.eq(0));
      });
    });
