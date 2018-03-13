# BlindLink

The protocol behind Bob Wallet

### Protocol

```
CONTINUOUS:
Bob User --> (Polls every 2 seconds for round state) --> Coordinator


SERVER ROUND STATES:
State #1: Join round

Bob User ---->  * Public address  
                * Public address proof            
                * Change address --------------> Coordinator
                                                  - Checks proof
                                                  - Checks balance
                                                  - Generate Unique User ID (Uuid)
Bob User <-------- * Uuid  <-----------------------


State #2: Round starts after enough Bob Users join

Bob User ---->  * Uuid        
                * Blinded private address  -----> Coordinator       
                                                  - Verifies uuid
                                                  - Signs blinded address
Bob User <-----  * Signed blinded address <-------


State #3: Register Private address

Bob User (Anonymous over second Tor url)
 - Unblinds address ----> * Private address  
                          * Private address signature ---> Coordinator
                                                           - Verifies signature


State #4: Transaction Signing

Bob User -------------------> * Uuid  ---------------------> Coordinator
                                                             - Creates unsigned CoinJoin transaction
 - Verifies addresses <------ * Unsigned TX <---------------
 - Signs transaction  ------> * Signed TX -----------------> - Combines all signatures
                                                             - Broadcasts fully signed transaction
```


### CoinJoin
[![Wikipedia: CoinJoin](https://upload.wikimedia.org/wikipedia/en/thumb/f/f0/CoinJoinExample.svg/640px-CoinJoinExample.svg.png)](https://en.wikipedia.org/wiki/CoinJoin)

### Chaum's Blind Signatures

Described by Gregory Maxwell:  
> Using chaum blind signatures: The users connect and provide inputs (and change addresses) and a cryptographically-blinded version of the address they want their private coins to go to; the server signs the tokens and returns them. The users anonymously reconnect, unblind their output addresses, and return them to the server. The server can see that all the outputs were signed by it and so all the outputs had to come from valid participants. Later people reconnect and sign.

[Source](https://bitcointalk.org/index.php?topic=279249)

### Similar Frameworks

##### ZeroLink
https://github.com/nopara73/ZeroLink/

- Similarities:
  - Uses a combination of CoinJoin and Chaum's Blind Signatures
  - Requires Tor
  - Fully on-chain transactions


- Differences:
  - ZeroLink is BTC only. BlindLink will work on both BTC and BCH
  - ZeroLink is written in C#. BlindLink is written in JavaScript
  - ZeroLink requires a program download solely for Linux, Mac and Windows. BlindLink is cross platform (desktop, phone, tablet, chromebook) to any device that can run a Tor Browser
