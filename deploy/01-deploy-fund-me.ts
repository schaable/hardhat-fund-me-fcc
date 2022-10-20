import { network } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../helper.hardhat.config";
import verify from "../utils/verify";

const deployFundMe = async ({ getNamedAccounts, deployments }: HardhatRuntimeEnvironment) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId!; // could be destructured from the hre instead
  const currentNetworkConfig = networkConfig[chainId as keyof typeof networkConfig];

  let ethUsdPriceFeedAddress;
  if (developmentChains.includes(chainId)) {
    const mockV3Aggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = mockV3Aggregator.address;
  } else {
    ethUsdPriceFeedAddress = currentNetworkConfig.ethUsdPriceFeedAddress;
  }

  const args = [ethUsdPriceFeedAddress];
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args,
    log: true,
    waitConfirmations: currentNetworkConfig.blockConfirmations || 1,
  });

  if (!developmentChains.includes(chainId) && process.env.ETHERSCAN_API_KEY) {
    await verify(fundMe.address, args);
  }

  log("FundMe deployed!");
  log("--------------------------------------------");
};

deployFundMe.tags = ["all", "fundMe"];

export default deployFundMe;
