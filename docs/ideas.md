# Ideas

## Blame game

Coordinator States:
1. Join
2. Blinding
3. Outputs
4. Signing

###### Idea #1
When users submit their signed Private address in Coordinator State #3 they also submit their blinded Public address to be signed by the Coordinator and returned. If the round fails because a user does not submit their Private address all the other users can prove to the Coordinator that they in fact did submit their Private address without revealing which Private address was theirs. This way there won't be empty addresses in the Private Wallet. (Caveat: If there are only 2 users in the round or if all other users do not submit their output address then the user who proves they submitted their address reveals their Private address and should not use that address again)

## DOS Protection

###### Idea #2
Users have to pay a deposit and receives a blinded token. The user can enter rounds by redeeming that token. If the round succeeds all those users are reissued a new token for another round. If the round fails because of a user than the blame game figures out who stopped the round and that users token is revoked. All the other users of the failed round who proved that they did not stop the round are reissued new tokens to continue to the next round. When users are done they can redeem their tokens for their deposit back or sell/give them to someone else using a blinded Chaum's eCash transfer method.

###### Idea #3
Same idea as #2 but instead of paying a deposit, the user has to complete a difficult reCAPTCHA problem to receive a token. These tokens can not be redeemed since they have no monetary value.

## Sybil Attacks

###### Idea #4
Coordinator has multiple known .onion addresses so a client can have 2 or more Bobs in the round to ensure that the Coordinator is not singling out a single Bob. Do you need multiple .onion addresses for this?

## Questions

###### Question #1
Can a server determine user origin from a .onion http request with no identifiable information? If so, would have a long list of .onion addresses and the user randomly choosing one every time it submits its Private address be more anonymous?
