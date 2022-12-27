import * as infuraProvider from "eth-json-rpc-infura/src/createProvider";
import * as Eth from "ethjs";
/*eslint import/namespace: "warn"*/
import * as moment from "moment";

import Config from "./Config";
import Logger from "./Logger";

export default class EthereumService {
  private eth1;
  private headers = new Headers();
  private queueLength: any = null;
  private queueDuration: any = null;
  private activeCount: any = null;
  private genesisTime = 1606824000;
  private pendingQueuedValidators = null;
  private activeValidators = null;
  //private FAR_FUTURE_EPOCH = 18446744073709551615;

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
    this.eth1 = new Eth(eth1RpcProvider);
    this.headers.set(
      "Authorization",
      "Basic " +
        Buffer.from(
          Config.INFURA_ETH2_PROJECT_ID +
            ":" +
            Config.INFURA_ETH2_PROJECT_SECRET
        ).toString("base64")
    );
  }

  // Count deposits that have a valid contract starting with block 11320899 (first block after genesis - delay)
  // and calculate with time based on validator activation rules
  // TODO: cache heavily
  // TODO: split processing into cronjob
  // TODO: validate contracts with eth_getTransactionReceipt, bad contract tx: 0xffff18a9c5da09f367325f4d98bb0cfb4f7885eddf3f010b1e6693c6852ac2c4
  // TODO: make this work on testnets
  public async calculateValidatorQueueLength() {
    // let balance = await this.eth1.getBalance(
    //   "0x00000000219ab540356cbb839cbe05303d7705fa"
    // );  return Eth1.fromWei(balance, "ether");

    if (this.queueLength === null) {
      if (moment() >= moment(this.genesisTime, "X")) {
        this.queueLength = (await this.getPendingQueueValidators())?.length;
      }

      // either before genesis, or fallback due to bad API.
      // TODO: retry primary if in fallback & use better calculation
      if (!this.queueLength || this.queueLength === 0) {
        const eth2DepositContractAddress =
          "0x00000000219ab540356cbb839cbe05303d7705fa";
        const postGenesisBlock = "11320899";

        const validatorLogs = await this.eth1.getLogs({
          fromBlock: new Eth.BN(postGenesisBlock),
          toBlock: "latest",
          address: eth2DepositContractAddress,
        });
        // Super weak calculation, take the time since genesis and assume 4 per epoch and subtract
        const timeSinceGenesis = Math.abs(
          moment
            .duration(moment().diff(moment(this.genesisTime, "X")))
            .asSeconds()
        ); //abs for before genesis
        const alreadyInvited = Math.floor(timeSinceGenesis / 96);
        this.queueLength = validatorLogs.length - alreadyInvited;
      }
    }

    return this.queueLength;
  }

  // TODO: cache heavily
  // TODO: split processing into cronjob
  // TODO: validate contracts with eth_getTransactionReceipt, bad contract tx: 0xffff18a9c5da09f367325f4d98bb0cfb4f7885eddf3f010b1e6693c6852ac2c4
  // TODO: make this work on testnets
  public async calculateActiveValidatorCount() {
    // try again if we have 0, either before activation (cheap) or error
    if (this.activeCount === null || this.activeCount === 0) {
      if (moment() >= moment(this.genesisTime, "X")) {
        this.activeCount = (await this.getActiveValidators())?.length;
      } else {
        this.activeCount = 0;
      }
    }

    return this.activeCount;
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
  // NOTE: This method is overly simple, especially for pre genesis, and will work before genesis and until the pending queue is empty

  public async calculateValidatorQueueDuration() {
    if (this.queueDuration === null) {
      // TODO:
      // 21063 genesis validators
      // 327680 - 21063 = 306617 validators before going up from 4, so have some time
      // 76654.25 epochs, so 306617 slots -> 3679404 seconds -> 1022.05667 h ->  42.5856944 days
      // so long way to say assume 4 new validators per epoch for now
      // 4 validators per epoch is 12 sec * 32 / 4 = 1 per every 96 seconds
      // 5 validators per epoch is 12 sec * 32 / 5 = 1 per every 76.8 seconds (is actually 5 per 6.4 min)
      const SECONDS_PER_SLOT = 12; //sec
      const SLOTS_PER_EPOCH = 32; //6.4 min
      const MIN_PER_EPOCH_CHURN_LIMIT = 4; // 2^2
      const CHURN_LIMIT_QUOTIENT = 65536; // 2^16
      // active_validator_indices = get_active_validator_indices(state, get_current_epoch(state))
      // return max(MIN_PER_EPOCH_CHURN_LIMIT, uint64(len(active_validator_indices)) // CHURN_LIMIT_QUOTIENT)

      // while pending_churn_limit is > current, calculate and strip

      const genesis = moment(this.genesisTime, "X");
      let offset = moment();
      const activeCount = (await this.calculateActiveValidatorCount()) || 0;
      const queueLength = (await this.calculateValidatorQueueLength()) || 0;
      const totalLength = activeCount + queueLength;

      const current_churn_limit = Math.max(
        MIN_PER_EPOCH_CHURN_LIMIT,
        Math.floor(activeCount / CHURN_LIMIT_QUOTIENT)
      );
      const pending_churn_limit = Math.max(
        MIN_PER_EPOCH_CHURN_LIMIT,
        Math.floor(totalLength / CHURN_LIMIT_QUOTIENT)
      );

      // current: 320,000; queue: 20,000 = (7680 * 96 sec) + (12320 * 76.8 sec) = 737280 + 946,176 = 1,683,456
      // current: 330,000; queue: 20,000 = 10000 * 76.8 sec = 768000
      let current_total_length = totalLength;
      let total_duration = 0;
      for (let i = pending_churn_limit; i >= current_churn_limit; i--) {
        const current_duration = (SECONDS_PER_SLOT * SLOTS_PER_EPOCH) / i;
        const current_queue_length =
          current_total_length -
          Math.max(activeCount, i * CHURN_LIMIT_QUOTIENT);
        current_total_length -= current_queue_length;
        total_duration += current_duration * current_queue_length;
      }

      if (offset < genesis) {
        offset = genesis;
      }
      offset.add(total_duration, "seconds");

      this.queueDuration = offset.unix();
      // NOTE: activation_epoch is almost always FAR_FUTURE_EPOCH
      //
      // let validators = (await this.getPendingQueueValidators()) || [];
      //
      // let lastEpoch = 0;
      // let lastEpochCount = 0; // 0-based
      // validators.forEach((validator: any) => {
      //   if (
      //     validator.activation_epoch > lastEpoch &&
      //     validator.activation_epoch !== this.FAR_FUTURE_EPOCH
      //   ) {
      //     lastEpoch = validator.activation_epoch;
      //     lastEpochCount = 0;
      //     Logger.info("LastEpoch", lastEpoch);
      //   } else if (validator.activation_epoch === lastEpoch) {
      //     lastEpochCount++;
      //   }
      // });
      // // TODO: need to toggle based on validator count: 4, or 5, etc.
      // genesis
      //   .add(lastEpoch * 32 * 12, "seconds")
      //   .add((lastEpochCount + 1) * 96, "seconds"); // +1 for next slot
      // this.queueDuration = genesis.unix();
    }

    return this.queueDuration;
  }

  private async getPendingQueueValidators(): Promise<any> {
    if (this.pendingQueuedValidators === null) {
      Logger.info("calling API");
      await fetch(
        Config.INFURA_ETH2_ENDPOINT +
          "/eth/v1/beacon/states/finalized/validators?status=pending_queued",
        { headers: this.headers }
      )
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            Logger.error(
              "Server returned " + response.status + " : " + response.statusText
            );
            return Promise.reject();
          }
        })
        .then((response: any) => {
          this.pendingQueuedValidators = response.data;
          return Promise.resolve();
        })
        .catch((err) => {
          Logger.error(err);
        });
    }
    return this.pendingQueuedValidators;
  }

  private async getActiveValidators(): Promise<any> {
    if (this.activeValidators === null) {
      Logger.info("calling API");
      await fetch(
        Config.INFURA_ETH2_ENDPOINT +
          "/eth/v1/beacon/states/finalized/validators?status=active_ongoing,active_exiting,active_slashed",
        { headers: this.headers }
      )
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            Logger.error(
              "Server returned " + response.status + " : " + response.statusText
            );
            return Promise.reject();
          }
        })
        .then((response: any) => {
          this.activeValidators = response.data;
          return Promise.resolve();
        })
        .catch((err) => {
          Logger.error(err);
        });
    }
    return this.activeValidators;
  }
}
