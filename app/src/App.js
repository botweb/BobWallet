import React, { Component } from 'react';
import Main from './views/main';

/* eslint-disable no-unused-vars */
import ActionsNav from './actions/nav';
import ActionsClient from './actions/client';
import ActionsSettings from './actions/settings';
/* eslint-enable no-unused-vars */

class App extends Component {
  render() {
    return <Main />;
  }
}

export default App;
