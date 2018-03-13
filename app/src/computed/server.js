import { computed, extendObservable } from 'mobx';

const ComputedServer = store => {
  extendObservable(store, {
    computedSafeRoundInfo: computed(() => {
      const { roundInfo } = store;
      const safeRoundInfo = roundInfo || {};
      return safeRoundInfo;
    }),
    computedServerError: computed(() => {
      const { computedSafeRoundInfo } = store;
      return computedSafeRoundInfo.serverError;
    }),
    computedRoundError: computed(() => {
      const { computedSafeRoundInfo } = store;
      return computedSafeRoundInfo.roundError;
    }),
    computedReadyToMix: computed(() => {
      const { computedSafeRoundInfo } = store;
      return !!computedSafeRoundInfo.readyToMix;
    }),
    computedReadyToJoin: computed(() => {
      const { computedSafeRoundInfo } = store;
      return !!computedSafeRoundInfo.readyToJoin;
    }),
    computedIsConnected: computed(() => {
      const { computedSafeRoundInfo } = store;
      return !!computedSafeRoundInfo.isConnected;
    }),
    computedIsConnecting: computed(() => {
      const { computedSafeRoundInfo } = store;
      return !!computedSafeRoundInfo.isConnecting;
    }),
    computedIsDisconnected: computed(() => {
      const { computedSafeRoundInfo } = store;
      return !!computedSafeRoundInfo.isDisconnected;
    }),
    computedProgress: computed(() => {
      const { computedSafeRoundInfo } = store;
      return computedSafeRoundInfo.progress || 0;
    }),
    computedState: computed(() => {
      const { computedSafeRoundInfo } = store;
      return computedSafeRoundInfo.currentState;
    }),
    computedServerStatus: computed(() => {
      const { computedSafeRoundInfo } = store;
      return computedSafeRoundInfo.serverStatus;
    }),
    computedIsJoining: computed(() => {
      const { computedSafeRoundInfo } = store;
      return !!computedSafeRoundInfo.isJoining;
    }),
    computedIsAutoJoining: computed(() => {
      const { computedSafeRoundInfo } = store;
      return !!computedSafeRoundInfo.isAutoJoining;
    }),
    computedInsufficientBalance: computed(() => {
      const { computedSafeRoundInfo } = store;
      return !!computedSafeRoundInfo.insufficientBalance;
    }),
    computedAttemptedJoin: computed(() => {
      const { computedSafeRoundInfo } = store;
      return !!computedSafeRoundInfo.attemptedJoin;
    }),
    computedIsJoined: computed(() => {
      const { computedSafeRoundInfo } = store;
      return !!computedSafeRoundInfo.isJoined;
    }),

    computedSuccessfulRounds: computed(() => {
      const { settings: { successfulRounds } } = store;
      return successfulRounds;
      // const { completedRounds } = store;
      // return completedRounds.reduce(
      //   (previous, round) => previous + (round.error ? 0 : 1),
      //   0
      // );
    }),
    computedFailedRounds: computed(() => {
      const { settings: { failedRounds } } = store;
      return failedRounds;
    }),

    computedBobBalance: computed(() => {
      const { settings: { privateBalance } } = store;
      return privateBalance;
      // const { completedRounds } = store;
      // return completedRounds.reduce(
      //   (previous, round) =>
      //     previous +
      //     (round.error || isNaN(parseInt(round.out, 10))
      //       ? 0
      //       : parseInt(round.out, 10)),
      //   0
      // );
    }),

    computedRoundsLeft: computed(() => {
      const {
        computedServerStatus,
        addressBalances,
        roundAddresses: { fromAddress },
      } = store;
      const roundsLeft =
        computedServerStatus && !isNaN(addressBalances[fromAddress])
          ? Math.floor(
              addressBalances[fromAddress] /
                (computedServerStatus.denomination + computedServerStatus.fees)
            )
          : 'Unknown';
      return roundsLeft;
    }),
    computedLastUpdated: computed(() => {
      const { computedServerStatus } = store;
      const secondsAgo = computedServerStatus
        ? Math.ceil(
            (new Date().getTime() -
              new Date(computedServerStatus.lastUpdated).getTime()) /
              1000
          )
        : 'Never';
      return secondsAgo;
    }),

    computedAliceHistory: computed(() => {
      const { completedRounds, roundAddresses: { fromAddress } } = store;

      const filteredRounds = completedRounds.filter(
        item =>
          item.from === fromAddress ||
          item.to === fromAddress ||
          item.change === fromAddress
      );
      return filteredRounds;
    }),
    computedBobHistory: computed(() => {
      const { completedRounds, roundAddresses: { toAddress } } = store;

      const filteredRounds = completedRounds.filter(
        item =>
          item.from === toAddress ||
          item.to === toAddress ||
          item.change === toAddress
      );
      return filteredRounds;
    }),
    computedHistory: computed(() => {
      const { completedRounds } = store;
      return completedRounds;
    }),
  });
};

export default ComputedServer;
