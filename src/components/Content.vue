<template>
  <div class="container" style="padding-top: 3%">
    <h2><a href="index.html">Eth2 Validator Queue Stats</a></h2>
    <h4>Beacon Chain</h4>

    <hr />

    <div class="row">
      <div class="column">
        <label>Pending Validators</label>
        <p id="pendingValidators">{{ validatorCount }}</p>
      </div>
      <div class="column">
        <label>Network</label>
        <p id="currentNetwork">{{ currentNetwork }}</p>
      </div>
    </div>

    <hr />
    <h5>New Validators</h5>
    <label>Estimated Activation</label>
    <div class="row">
      <div class="column">
        <p id="estimatedTime">{{ estimatedTime }}</p>
      </div>
      <div class="column">
        <p id="estimatedCheckpoints">{{ estimatedCheckpoints }}</p>
      </div>
    </div>

    <hr />
    <small>Refreshes every 2 minutes</small>
    <!--
    <div class="row">
      <div class="column">
        <label>Block # or Hash</label>
        <input type="text" id="blockSearchValue" placeholder="45028923" />
      </div>
      <div class="column">
        <br />
        <button id="searchBlock">Search Block</button>
      </div>
      <div class="column">
        <label>Transaction Hash</label>
        <input
          type="text"
          id="transactionSearchValue"
          placeholder="0x365b070c8cbac9..."
        />
      </div>
      <div class="column">
        <br />
        <button id="searchTransaction">Search Transaction</button>
      </div>
    </div>

    <br />

    <div id="blockSearch" style="display: none;">
      <h3>Block Information</h3>

      <div style="padding: 20px; border: 1px solid #F1F1F1;">
        TimeStamp: <span id="searchBlockTimeAgo">0</span><br />
        Transactions: <span id="searchBlockTransactions">0</span> transactions
        in this block<br />
        Hash: <span id="searchBlockHash">0x</span><br />
        Parent Hash: <span id="searchBlockParentHash">0x</span><br />
        Mined By: <span id="searchBlockMiner">0x</span><br />
        Difficulty: <span id="searchBlockDifficulty">0</span><br />
        Size: <span id="searchBlockSize">0</span> bytes<br />
        Gas Limit: <span id="searchBlockGasLimit">0</span><br />
        Gas Used: <span id="searchBlockGasUsed">0</span><br />
        Nonce: <span id="searchBlockNonce">0x</span><br />
        Uncles: <span id="searchBlockUncles">0</span><br />
      </div>
    </div>

    <div id="transactionSearch" style="display: none;">
      <h3>Transaction Information</h3>

      <div style="padding: 20px; border: 1px solid #F1F1F1;">
        TxHash: <span id="txHash"></span><br />
        From: <span id="txFrom"></span><br />
        To: <span id="txTo"></span><br />
        Value: <span id="txValue"></span> Ether<br />
        Gas: <span id="txGas"></span><br />
        Gas Price: <span id="txGasPrice"></span> Ether<br />
        Gas Used By Transaction: <span id="txGasUsed"></span><br />
        Actual Tx Cost/Fee: <span id="txCost"></span> Ether<br />
        Cumulative Gas Used:<span id="txCumulativeGasUsed"></span><br />
        Nonce: <span id="txNonce"></span><br />
      </div>
    </div>

    <div id="response" style="padding: 20px; border: 1px solid #F1F1F1;"></div>
    -->
  </div>
</template>

<script>
import * as moment from "moment";
//import * as dayjs from "dayjs";
// import * as relativeTime from "dayjs/plugin/relativeTime";
// import * as calendar from "dayjs/plugin/calendar";
// import * as utc from "dayjs/plugin/utc";
// dayjs.extend(relativeTime);
// dayjs.extend(calendar);
// dayjs.extend(utc);

export default {
  name: "Content",
  props: {
    msg: String,
  },
  data() {
    return {
      currentNetwork: "Ethereum Mainnet",
      validatorCount: "Loading...",
      estimatedTime: "Loading...",
      estimatedCheckpoints: "Loading...",
    };
  },
  methods: {
    updateValidatorQueue: function () {
      (this.validatorCount = "Loading..."),
        (this.estimatedTime = "Loading..."),
        (this.estimatedCheckpoints = "Loading...");
      fetch(
        "https://us-central1-eth2-validator-queue.cloudfunctions.net/validatorQueue",{},30000
      )
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            (this.validatorCount = "Error...please refresh manually "),
              (this.estimatedTime = "Error..."),
              (this.estimatedCheckpoints = "Error...");
            console.log(
              "Server returned " + response.status + " : " + response.statusText
            );
          }
        })
        .then((response) => {
          this.validatorCount = response.length;
          this.estimatedTime = this.getEstimatedTime(response.duration);
          this.estimatedCheckpoints = this.getEstimatedCheckpoint(
            response.duration
          );
        })
        .catch((err) => {
          (this.validatorCount = "Error...please refresh manually "),
            (this.estimatedTime = "Error..."),
            (this.estimatedCheckpoints = "Error...");
          console.log(err);
        });
    },
    getEstimatedTime: function (unixTime) {
      return moment.unix(unixTime).local().toString();
    },
    getEstimatedCheckpoint: function (unixTime) {
      const genesisTime = 1606824000;
      const totalSeconds = unixTime - genesisTime;

      const epochSeconds = 12 * 32;
      const epochNumber = Math.floor(totalSeconds / epochSeconds);

      // The Slots vs Block logic may not be accurate.
      // Slots may increment forever, not per Epoch
      //const remainingSlotSeconds = totalSeconds % epochSeconds;
      const slotSeconds = 12;
      //const slotNumber = remainingSlotSeconds / slotSeconds;
      const slotNumber = Math.floor(totalSeconds / slotSeconds);

      // TODO: make beaconcha.in links
      return `Epoch ${epochNumber} / Slot ${slotNumber}`;
    },
  },
  created: function () {
    setInterval(this.updateValidatorQueue, 2 * 60 * 1000);
    this.updateValidatorQueue();
  },
};
</script>
<!--
    <script type="text/javascript" src="ethjs.js"></script>
    <script type="text/javascript">
      var eth = new Eth(
        new Eth.HttpProvider(
          "https://mainnet.infura.io/v3/xxxx"
        )
      );
      var el = function(id) {
        return document.querySelector(id);
      };

      /*
      // uncomment to enable MetaMask support:
      if (typeof window.web3 !== 'undefined' && typeof window.web3.currentProvider !== 'undefined') {
        eth.setProvider(window.web3.currentProvider);
      } else {
        eth.setProvider(provider); // set to TestRPC if not available
      }
      */

      function updateLastBlock() {
        eth
          .getBlockByNumber("latest", false)
          .then(function(block) {
            el("#lastBlockNumber").innerHTML = block.number.toString(10);
            el("#lastBlockHash").innerHTML = block.hash.substr(0, 12) + "..";
            el("#lastBlockTransactions").innerHTML = block.transactions.length;
            el("#lastBlockCreated").innerHTML = new Eth.BN(
              new Date().getTime() / 1000
            )
              .sub(block.timestamp)
              .toString(10);
          })
          .catch(function(blockError) {
            el("#response").innerHTML =
              "Hmm.. there was an error: " + String(blockError);
          });
      }

      el("#searchBlock").addEventListener("click", function() {
        var searchValue = el("#blockSearchValue").value;
        var searchMethod = "getBlockByNumber";
        el("#response").style.display = "block";
        el("#transactionSearch").style.display = "none";
        el("#blockSearch").style.display = "block";
        el("#response").innerHTML = "Search for block...";

        if (Eth.isHexString(searchValue)) {
          searchMethod = "getBlockByHash";
        }

        eth[searchMethod](searchValue, false)
          .then(function(searchBlock) {
            el("#response").style.display = "none";

            el("#searchBlockTimeAgo").innerHTML = new Date(
              searchBlock.timestamp.mul(new Eth.BN(1000)).toNumber(10)
            ).toISOString();
            el("#searchBlockTransactions").innerHTML =
              searchBlock.transactions.length;
            el("#searchBlockHash").innerHTML = searchBlock.hash;
            el("#searchBlockParentHash").innerHTML = searchBlock.parentHash;
            el("#searchBlockMiner").innerHTML = searchBlock.miner;
            el(
              "#searchBlockDifficulty"
            ).innerHTML = searchBlock.difficulty.toString(10);
            el("#searchBlockSize").innerHTML = searchBlock.size.toString(10);
            el(
              "#searchBlockGasLimit"
            ).innerHTML = searchBlock.gasLimit.toString(10);
            el("#searchBlockGasUsed").innerHTML = searchBlock.gasUsed.toString(
              10
            );
            el("#searchBlockNonce").innerHTML = searchBlock.nonce;
            el("#searchBlockUncles").innerHTML = searchBlock.uncles.length;
          })
          .catch(function(blockError) {
            el("#response").innerHTML =
              "Hmm.. there was an error: " + String(blockError);
          });
      });

      el("#searchTransaction").addEventListener("click", function() {
        el("#response").style.display = "block";
        el("#blockSearch").style.display = "none";
        el("#response").innerHTML = "Search for transaction...";

        eth
          .getTransactionByHash(el("#transactionSearchValue").value)
          .then(function(transaction) {
            eth.getTransactionReceipt(transaction.hash).then(function(receipt) {
              el("#transactionSearch").style.display = "block";
              el("#response").style.display = "none";

              el("#txHash").innerHTML = transaction.hash;
              el("#txFrom").innerHTML = transaction.from;
              el("#txTo").innerHTML = transaction.to;
              el("#txValue").innerHTML = Eth.fromWei(
                transaction.value,
                "ether"
              );
              el("#txGas").innerHTML = transaction.gas.toString(10);
              el("#txGasPrice").innerHTML = Eth.fromWei(
                transaction.gasPrice,
                "ether"
              );
              el("#txGasUsed").innerHTML = Eth.fromWei(
                receipt.gasUsed,
                "ether"
              );
              el("#txCost").innerHTML = Eth.fromWei(
                receipt.cumulativeGasUsed,
                "ether"
              );
              el(
                "#txCumulativeGasUsed"
              ).innerHTML = receipt.cumulativeGasUsed.toString(10);
              el("#txNonce").innerHTML = transaction.nonce.toString(10);
            });
          })
          .catch(function(txError) {
            el("#response").innerHTML =
              "Hmm.. there was an error: " + String(txError);
          });
      });
      setInterval(updateValidatorQueue, .05* 60 * 1000);
      updateValidatorQueue();
    </script>
-->

<!-- Add "scoped" attribute to limit CSS to this component only -->
