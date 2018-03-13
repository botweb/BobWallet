# Welcome to Bob Wallet
Note: This software is in Beta and should only be used on Testnet until thoroughly tested!

## What is Bob Wallet?
Bob Wallet was created to help preserve Bitcoins fungibility. Today it is easy to trace Bitcoin transactions from address to address by simply using any public Block Explorer. Bob Wallet helps fix this.

To start, you will create a Bob Wallet and deposit Bitcoin to your Public address. Bob Wallet will automatically move your Bitcoin from your Public to your Private Wallet. This transfer happens by joining together all other Bob Wallet users in order to create a single transaction called a CoinJoin. Your Bitcoin can not be stolen since only you own and control your wallet keys and [no one can determine your Private Wallet addresses](https://github.com/bobwallet/bobwallet/blob/master/docs/blindlink.md). Let's help keep Bitcoin fungible!

## What is Bob Wallet not?

Bob Wallet is not a traditional Bitcoin wallet. You cannot use it to make a payment to someone else. It's only purpose right now is to move your Bitcoins from your Public Wallet to your Private Wallet securely without anyone knowing your Private Wallet addresses. You will have to use a separate Bitcoin wallet after your Bitcoin has been moved Private in order to spend them. Ideally, use a full-node for your Private Wallet because 3rd-party balance queries can de-anonymize you.

## How to get started
1. [Download and install the Tor Browser](https://www.torproject.org/download/download-easy.html)
2. Open the Tor Browser and visit the website: [https://BobWallet.github.io/BobWallet/](https://bobwallet.github.io/BobWallet/) OR download Bob Wallet and open (drag and drop) `index.html` in the Tor Browser
3. Create a new Bob Wallet
4. Deposit Bitcoin into your Public Wallet
5. Bob Wallet will automatically enter you into CoinJoin rounds with every other Bob Wallet user
6. A successful round will send a portion of your Public Bitcoin into your Private Wallet
7. Bob Wallet will automatically add you into following rounds until all of your Public Bitcoin is moved to your Private Wallet

## Voting Booth (Donations)
BTC: [15fMSRKT8pP1XMfc6YM7ckH87uc9YaRcaa](bitcoin:15fMSRKT8pP1XMfc6YM7ckH87uc9YaRcaa)

BCH: [1BWTtWVk3U1JvgcV3mwDEaQDMpSpBzXLw9](bitcoincash:1BWTtWVk3U1JvgcV3mwDEaQDMpSpBzXLw9)

Which coin should we focus on first? Vote with your favorite currency!


## Advantages
* [You don't need to trust anyone with your Bitcoin](https://github.com/bobwallet/bobwallet/blob/master/docs/blindlink.md)
* Rounds are quick (Between 30 to 90 seconds per round)
* Can support many participants. More users, more privacy
* No need to download, compile or configure a complex program. It's as simple as visiting a website in your Tor Browser. This also makes it fully cross platform on ANY device that can run a Tor Browser

## Questions
* What is Bob Wallet?
  - Bob Wallet securely connects you with many other users to create a single transaction called a CoinJoin. Bob Wallet will create you two wallets: Public and Private. You will deposit Bitcoin to the Public Wallet and Bob Wallet will automatically send it to your Private Wallet. By joining a combined transaction with as many people as possible it ensures the privacy of your Bitcoins in your Private Wallet. Not even the server can figure out which Private Wallet address is yours.


* Why is Bob Wallet needed?
  - To help preserve Bitcoin fungibility. Every Bitcoin transaction can be easily traced and balances determined. Not everyone needs to know how much Bitcoin you own by just visiting a Block Explorer.


* How is Bob Wallet trustless?
  - It uses a combination of CoinJoin and Chaum's Blind Signatures. You never hand over control to anyone and your Bitcoin can not be stolen. You can read more about the [techniques here](https://github.com/bobwallet/bobwallet/blob/master/docs/blindlink.md).


* Why do I have to use Tor?
  - Tor is necessary to protect the server from determining your Private Wallet addresses. No one but you knows the addresses of your Private Wallet.


* Why do I have to wait so long for Bitcoin to show up in my Private Wallet?
  - Every successful round will deposit a specific amount of Bitcoin into your Private Wallet. For beta testing purposes the output amount is really low so that more rounds can be run while using less Testnet Bitcoin. This will be changed later.


* Why did we build Bob Wallet?
  - For your donations and to compete for [this bounty](https://bitcointalk.org/index.php?topic=279249.msg2983911#msg2983911). Help support us if you like Bob Wallet!


* How can I help?
  - Help by using and contributing to Bob Wallet. The more people we have using it the faster we can find and fix bugs and improve the experience. Once we are sure Bob Wallet is safe and secure we can move it to the Mainnet. Donations are also much appreciated! Let's help keep Bitcoin fungible!


## Brainstorming

[Listed here](https://github.com/bobwallet/bobwallet/blob/master/docs/ideas.md)

## Testing Plan

[Listed here](https://github.com/bobwallet/bobwallet/blob/master/docs/testing.md)

## Future Features

[Listed here](https://github.com/bobwallet/bobwallet/blob/master/docs/future.md)

## Developers Corner

##### Build Web App

```
npm run build
```

##### Run Tests

```
npm run test
```

##### Run Dev Mode

```
npm run server

# Open new terminal tab

npm run dev
```

### Paranoid? Build Bob from the Bottom Up

1. Clone Bob Wallet `git clone https://github.com/bobwallet/bobwallet.git` and then `cd ./BobWallet`
2. Build bcoin from source `npm run build-bcoin`
3. Build web app `npm run build`
4. Copy built web app unto USB Drive `cp ./index.html ...`
5. Run Tails
6. Copy `index.html` from your USB Drive into your `Tor Persistent` folder
7. Connect to the internet and open `index.html` in the Tor Browser
8. Start using Bob Wallet!
