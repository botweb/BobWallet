import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity, View, Clipboard } from 'react-native';
import QRCode from './qrcode';
import ComponentArrow from './arrow';
import { formatSat } from '../helpers';
import { Text } from './text';
import { colors } from '../styles';
import moment from 'moment';

class ComponentAddress extends Component {
  constructor() {
    super();
    this.state = {
      showPrivate: false,
    };
  }

  render() {
    const { showPrivate } = this.state;
    const {
      title,
      onPressUp,
      onPressDown,
      address,
      privateKey,
      onValueChange,
      value,
      derivePath,
      balance,
      ticker,
      wholeNumbers,
      flashMessage,
      simpleMode,
      privateAddress,
      disableIncrementor,
      date,
      bobs,
    } = this.props;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <Text style={{ marginRight: 10 }} selectable={false}>
                {title}
              </Text>
              {!simpleMode && (
                <Text style={{ color: colors.gray }}>{derivePath}</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => {
                Clipboard.setString(address);
                flashMessage('Copied Address');
              }}
              style={{
                width: 335,
                borderWidth: 1,
                borderColor: colors.darkgray,
                shadowRadius: 4,
                shadowOpacity: 0.3,
                shadowColor: colors.black,
                shadowOffset: { width: 1, height: 1 },
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ marginTop: 12, marginBottom: 12 }}>{address}</Text>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: 'row',
                marginTop: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.gray }}>
                {formatSat(balance, ticker, wholeNumbers)}
              </Text>
              {typeof bobs !== 'undefined' && (
                <Text style={{ marginLeft: 12, color: colors.gray }}>
                  {bobs} Bobs
                </Text>
              )}
              {!!date && (
                <Text style={{ marginLeft: 12, color: colors.gray }}>
                  {moment(date).fromNow()}
                </Text>
              )}
            </View>
          </View>
        </View>
        {!disableIncrementor && (
          <ComponentArrow
            onPressUp={() => onPressUp()}
            onPressDown={() => onPressDown()}
            value={value}
            onValueChange={text => onValueChange(text)}
            disabled={false}
          />
        )}

        {(!simpleMode || !privateAddress) && (
          <View
            style={{
              width: 120,
              height: 120,
              margin: 20,
              backgroundColor: 'white',
            }}
          >
            <QRCode address={address} />
          </View>
        )}

        {!!privateKey &&
          (!simpleMode || privateAddress) && (
            <TouchableOpacity
              style={{
                width: 120,
                height: 120,
                marginLeft: 12,
                margin: 4,
                borderWidth: showPrivate ? 0 : 0.5,
                borderColor: colors.white,
                backgroundColor: showPrivate ? 'white' : colors.darkgray,
              }}
              onPress={() => {
                if (!showPrivate) {
                  Clipboard.setString(privateKey);
                  flashMessage('Copied private key');
                }
                this.setState({ showPrivate: !showPrivate });
              }}
            >
              {showPrivate ? (
                <QRCode address={privateKey} />
              ) : (
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                  }}
                >
                  <Text style={{ color: colors.gray, textAlign: 'center' }}>
                    Copy Private Key
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
      </View>
    );
  }
}

ComponentAddress.propTypes = {
  title: PropTypes.string,
  onPressUp: PropTypes.func,
  onPressDown: PropTypes.func,
  address: PropTypes.string,
  privateKey: PropTypes.string,
  onValueChange: PropTypes.func,
  value: PropTypes.any,
  derivePath: PropTypes.string,
  balance: PropTypes.number,
  ticker: PropTypes.string,
  wholeNumbers: PropTypes.bool,
  flashMessage: PropTypes.func,
  simpleMode: PropTypes.bool,
  privateAddress: PropTypes.bool,
  disableIncrementor: PropTypes.bool,
  date: PropTypes.any,
  bobs: PropTypes.number,
};

export default ComponentAddress;
