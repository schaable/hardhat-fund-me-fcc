export const networkConfig = {
  5: {
    name: "goerli",
    ethUsdPriceFeedAddress: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
    blockConfirmations: 6,
  },
  31337: {
    name: "localhost",
    ethUsdPriceFeedAddress: undefined,
    blockConfirmations: 1,
  },
};

export const developmentChains = [31337];

export const DECIMALS = 8;
export const INITIAL_ANSWER = 200000000000;
