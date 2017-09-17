/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry
} from 'react-native';
import { StackNavigator } from 'react-navigation';
import Login from './components/Login';
import Main from './components/Main';

const WalkingPoint = StackNavigator({
  Home: { screen: Login },
  Main: { screen: Main },
});

AppRegistry.registerComponent('WalkingCount', () => WalkingPoint);
