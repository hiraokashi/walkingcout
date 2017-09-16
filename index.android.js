/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Button,
  DeviceEventEmitter // will emit events that you can listen to
} from 'react-native';
import { StackNavigator } from 'react-navigation';
import { SensorManager } from 'NativeModules';
import { SharedPreferences } from 'react-native-shared-preferences';

SensorManager.startStepCounter(1000);


class Login extends Component {
  static navigationOptions = {
    title: 'ログイン',
  };
  constructor(props) {
    super(props)
    this.login = this.login.bind(this)
  }
  componentWillMount() {
    // 永続化したデータの読み出し
    // ログイン済みなら歩数画面へ遷移
    const { navigate } = this.props.navigation;
    if (false) navigate('Main')
  }
  render(){
    const { navigate } = this.props.navigation;
    return (
      <Button
      onPress={() => login()}
      title="ログイン"
      accessibilityLabel="Learn more about this purple button"
      />
    );
  }

  login(){
    // 1.フォームデータを取得
    // フォームの情報を永続化しておく
    //
    SharedPreferences.setItem("id",1);
    navigate('Main');
  }
}


class Main extends Component {
  static navigationOptions = {
    title: '歩数計測',
  };
  constructor(props) {
    super(props)
    this.state = { count: 0 };
    this.countUp = this.countUp.bind(this)
  }
  countUp(step) {
    this.setState({ count: step })
  }
  componentDidMount() {
    // 永続化したデータの読み出し
    this.setState({count: SharedPreferences.getItem("count")});
    DeviceEventEmitter.addListener('StepCounter', (data) => {
      this.countUp(data.steps)
      /**
       * data.steps
       **/
    });
  }
  componentWillUnmount() {
    // データを永続化
    SensorManager.stopStepCounter();
  }
  render() {
    const { navigate } = this.props.navigation;
    return (
      <View style={styles.container}>
      <Text style={styles.welcome}>
          今日の歩数
           {this.state.count}歩！
      </Text>
      </View>
    );
  }
}

const SimpleApp = StackNavigator({
  Home: { screen: Login },
  Main: { screen: Main },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('WalkingCount', () => SimpleApp);
