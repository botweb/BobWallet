import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View, ScrollView, Clipboard, TouchableOpacity } from 'react-native';
import { Text, TextB } from './text';
import { colors } from '../styles';
import { formatSat } from '../helpers';
import moment from 'moment';

class ComponentHistory extends Component {
  render() {
    const {
      simpleMode,
      completedRounds,
      filterAddress,
      wholeNumbers,
      flashMessage,
      ticker,
      lastRawTx,
    } = this.props;

    return (
      <View style={{ flex: 1, minWidth: 400 }}>
        {completedRounds.length === 0 ? (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <TextB style={{ fontSize: 15 }}>No Rounds</TextB>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <TextB selectable={false}>
              {filterAddress ? 'Rounds' : 'All Rounds'}
            </TextB>
            <View style={{ height: 0.5, backgroundColor: colors.gray }} />
            <ScrollView style={{ flex: 1 }}>
              {completedRounds.map((round, index) => {
                const {
                  txid,
                  error,
                  bobs,
                  date,
                  from,
                  fees,
                  to,
                  change,
                  left,
                  out,
                } = round;
                const isFrom = from === filterAddress;
                const isTo = to === filterAddress;
                const isChange = change === filterAddress;
                const textColorLeft = colors.gray;
                const textColorRight = colors.lightgray;
                let serialized;
                if (lastRawTx && txid === lastRawTx.txid) {
                  serialized = lastRawTx.tx;
                }
                return (
                  <View
                    key={index}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.gray,
                      padding: 12,
                      marginTop: 6,
                      marginBottom: 6,
                      marginRight: 1,
                      flex: 1,
                    }}
                  >
                    {!!error && (
                      <View style={{ flexDirection: 'row' }}>
                        <View style={{ alignItems: 'flex-end' }}>
                          {!!error && (
                            <TextB style={{ color: colors.red }}>Error:</TextB>
                          )}
                        </View>
                        <View>
                          {!!error && (
                            <TextB style={{ color: colors.red }}>
                              {' '}
                              {error}
                            </TextB>
                          )}
                        </View>
                      </View>
                    )}
                    {isFrom && (
                      <Text style={{ color: colors.red }}>
                        {'Public Wallet → Sent'}
                      </Text>
                    )}
                    {isTo && (
                      <Text style={{ color: colors.green }}>
                        {'Received → Private Wallet'}
                      </Text>
                    )}
                    {isChange && (
                      <Text style={{ color: colors.green }}>
                        {'Received → Change'}
                      </Text>
                    )}
                    {simpleMode &&
                      !filterAddress && (
                        <View style={{ flexDirection: 'row' }}>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: textColorLeft }}>
                              To Bob:
                            </Text>
                            {!error && (
                              <Text style={{ color: textColorLeft }}>
                                Amount:
                              </Text>
                            )}
                            <Text style={{ color: textColorLeft }}> </Text>
                          </View>
                          <View>
                            <Text style={{ color: textColorRight }}> {to}</Text>
                            {!error && (
                              <Text style={{ color: textColorRight }}>
                                {' '}
                                {formatSat(out, ticker, wholeNumbers)}
                              </Text>
                            )}

                            <Text style={{ color: textColorRight }}>
                              {` ${moment(date).fromNow()}`}
                            </Text>
                          </View>
                        </View>
                      )}
                    {simpleMode &&
                      !!filterAddress && (
                        <View>
                          {!isChange && (
                            <Text style={{ color: textColorRight }}>
                              {formatSat(out, ticker, wholeNumbers)}
                            </Text>
                          )}
                          {isChange && (
                            <Text style={{ color: textColorRight }}>
                              {' '}
                              {formatSat(left, ticker, wholeNumbers)}
                            </Text>
                          )}
                          <Text style={{ color: textColorRight }}>
                            {` ${moment(date).fromNow()}`}
                          </Text>
                        </View>
                      )}
                    {!simpleMode && (
                      <View style={{ flexDirection: 'row' }}>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: textColorLeft }}>TXID:</Text>
                          <Text style={{ color: textColorLeft }}>Bobs:</Text>
                          <Text style={{ color: textColorLeft }}>From:</Text>
                          <Text style={{ color: textColorLeft }}>To:</Text>
                          <Text style={{ color: textColorLeft }}>To:</Text>
                          <Text style={{ color: textColorLeft }}>Change:</Text>
                          {!error && (
                            <Text style={{ color: textColorLeft }}>
                              Change:
                            </Text>
                          )}
                          {!error && (
                            <Text style={{ color: textColorLeft }}>Fees:</Text>
                          )}
                          <Text style={{ color: textColorLeft }}>Date:</Text>
                        </View>
                        <View>
                          <Text style={{ color: textColorRight }}> {txid}</Text>
                          <Text style={{ color: textColorRight }}> {bobs}</Text>
                          <Text style={{ color: textColorRight }}> {from}</Text>
                          <Text style={{ color: textColorRight }}> {to}</Text>
                          <Text style={{ color: textColorRight }}>
                            {' '}
                            {formatSat(out, ticker, wholeNumbers)}
                          </Text>
                          <Text style={{ color: textColorRight }}>
                            {' '}
                            {change}
                          </Text>
                          {!error && (
                            <Text style={{ color: textColorRight }}>
                              {' '}
                              {formatSat(left, ticker, wholeNumbers)}
                            </Text>
                          )}
                          {!error && (
                            <Text style={{ color: textColorRight }}>
                              {' '}
                              {formatSat(fees, ticker, wholeNumbers)}
                            </Text>
                          )}
                          <Text style={{ color: textColorRight }}>
                            {` ${moment(date).format(
                              'MMMM Do YYYY, H:mm:ss'
                            )}  (${moment(date).fromNow()})`}
                          </Text>
                          {serialized && (
                            <TouchableOpacity
                              onPress={() => {
                                Clipboard.setString(serialized);
                                flashMessage('Copied Raw TX');
                              }}
                            >
                              <Text style={{ color: textColorLeft }}>
                                Click to copy raw tx
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }
}

ComponentHistory.propTypes = {
  completedRounds: PropTypes.any,
  filterAddress: PropTypes.string,
  wholeNumbers: PropTypes.bool,
  flashMessage: PropTypes.func,
  ticker: PropTypes.string,
  simpleMode: PropTypes.bool,
  lastRawTx: PropTypes.object,
};

export default ComponentHistory;
