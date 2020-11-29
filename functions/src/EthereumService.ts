import * as infuraProvider from "eth-json-rpc-infura/src/createProvider";
import * as Eth1 from "ethjs";
import * as moment from "moment";

import Config from "./Config";
import Logger from "./Logger";

export default class EthereumService {
  private eth1;
  private queueLength = null;
  private queueDuration: any = null;

  // TODO: Lookup based on eth1 or tx address

  // CONTRACT CONSTANTS
  // Seconds_Per_Eth1_Block = 14 seconds
  // Eth1_Follow_Distance = 2048 blocks * 14 seconds
  // Min_Genesis_Time = 1606824000 (12:00:00 pm UTC | Tuesday, December 1, 2020)
  // Min_Genesis_Active_Validator_Count = 16,384
  // Genesis_Delay = 7 days
  // 32 Slots = 1 Epoch, a time period of 12 seconds

  constructor(
    eth1RpcProvider = infuraProvider({
      network: Config.NETWORK,
      projectId: Config.INFURA_PROJECT_ID,
    })
  ) {
    this.eth1 = new Eth1(eth1RpcProvider);
  }

  // Count deposits that have a valid contract starting with block 11320899 (first block after genesis - delay)
  // and calculate with time based on validator activation rules
  // TODO: split processing into cronjob
  // TODO: validate contracts with eth_getTransactionReceipt, bad contract tx: 0xffff18a9c5da09f367325f4d98bb0cfb4f7885eddf3f010b1e6693c6852ac2c4
  // TODO: make this work on testnets
  public async calculateValidatorQueueLength() {
    // let balance = await this.eth1.getBalance(
    //   "0x00000000219ab540356cbb839cbe05303d7705fa"
    // );  return Eth1.fromWei(balance, "ether");

    if (this.queueLength === null) {
      const eth2DepositContractAddress =
        "0x00000000219ab540356cbb839cbe05303d7705fa";
      const postGenesisBlock = "11320899";

      let validatorLogs = await this.eth1.getLogs({
        fromBlock: new Eth1.BN(postGenesisBlock),
        toBlock: "latest",
        address: eth2DepositContractAddress,
      });
      Logger.debug(validatorLogs, {
        structuredData: true,
      });

      this.queueLength = validatorLogs.length;
    }

    return this.queueLength;
  }

  // https://kb.beaconcha.in/glossary#validator-lifecycle
  // Validator Lifecycle
  //   1. Deposited
  //     * 32 ETH has been deposited to the ETH1 deposit-contract and this state will be kept for around 7 hours.
  //       This offers security in case the ETH1 chain gets attacked.
  //   2. Pending
  //     Waiting for activation on ETH2
  //     * Until 327680 active validators in the network, 4 validators can be activated per epoch.
  //       For every 65536 (=4 * 16384) active validator, the validator activation rate goes up by one.
  //       5 validators per epoch requires 327680 active validators.
  //
  //     * Amount of activations scales with the amount of active validators and the limit is the active validator set divided by 64.000
  //
  // NOTE: This method is overly simple and will work before genesis and until the pending queue is empty
  // TODO: make more robust or switch over to eth2 API (after 64 epochs = Eth1_follow_distance)
  // Ideally the latter but need public API, ideally using Lighthouse validator status spec, opposed to official
  //
  // TODO: calculate based on the block. How does this work for eth1? Can use eth2 for sure.
  // TODO: calculate based on active validator count.

  public async calculateValidatorQueueDuration() {
    if (this.queueDuration === null) {
      let queueLength = (await this.calculateValidatorQueueLength()) || 0;

      // TODO:
      // 21063 genesis validators
      // 327680 - 21063 = 306617 validators before going up from 4, so have some time
      // 76654.25 epochs, so 306617 slots -> 3679404 seconds -> 1022.05667 h ->  42.5856944 days
      // so long way to say assume 4 new validators per epoch for now
      // 4 validators per epoch is 12 sec * 32 / 4 = 1 per every 96 seconds

      const genesisTime = 1606824000;
      let offset = moment();
      let genesis = moment(genesisTime, "X");

      if (offset < genesis) {
        offset = genesis;
      }
      offset.add(96 * queueLength, "seconds");

      this.queueDuration = offset.format("X");
    }

    return this.queueDuration;
  }
}
