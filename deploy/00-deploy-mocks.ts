import { network } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DECIMALS, developmentChains, INITIAL_ANSWER, networkConfig } from "../helper.hardhat.config";

const deployMocks = async ({ getNamedAccounts, deployments }: HardhatRuntimeEnvironment) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId!; // could be destructured from the hre instead

  if (developmentChains.includes(chainId)) {
    log("Local network detected! Deploying mocks...");
    const mockV3Aggregator = await deploy("MockV3Aggregator", {
      from: deployer,
      args: [DECIMALS, INITIAL_ANSWER],
      log: true,
    });
    log("Mocks deployed!");
    log("--------------------------------------------");
  }
};

deployMocks.tags = ["all", "mocks"];

export default deployMocks;
