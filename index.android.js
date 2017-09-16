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
import SharedPreferences from 'react-native-shared-preferences';

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
      onPress={() => this.login()}
      title="ログイン"
      accessibilityLabel="Learn more about this purple button"
      />
    );
  }

  login(){
    // 1.フォームデータを取得
    // フォームの情報を永続化しておく
    //
    SharedPreferences.setItem("id",'1');
    SharedPreferences.setItem("count",'100');
    const { navigate } = this.props.navigation;
    navigate('Main');
  }
}


class Main extends Component {
  static navigationOptions = {
    title: '歩数計測',
  };
  constructor(props) {
    super(props)
    this.state = { id: 0, count: 0, updatedAt: '', noticedAt: '', error: '' };
    this.countUp = this.countUp.bind(this)
    this.syncServer = this.syncServer.bind(this)
  }
  // 歩数をカウントアップする
  countUp(step) {
    this.setState({ count: step })
  }
  //サーバへ同期する
  syncServer(){
    if (this.state.id > 0) {
      fetch(`http://127.0.0.1:3000/api/v1/insurers/${this.state.id}/walk_logs/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: this.state.count
        }) })
      .then((response) => response.json())
      .then((responseData) => {
        this.setState({count: 300});
        return [];
      })
      .catch((error) => {
        console.log(error);
      })
    }
  }
  componentDidMount() {
    // 永続化したデータの読み出し
    SharedPreferences.getItems(['id', "count", "updatedAt", "noticedAt"] , (values) =>  {
      this.setState({id: parseInt(values[0]), count: parseInt(values[1]), updatedAt: values[2], noticedAt: values[3]});
      // アプリロード時に毎回同期
      this.syncServer();

      // stateをできたらカウントを実行する
      DeviceEventEmitter.addListener('StepCounter', (data) => {
        /**
         * data.steps
         **/
        this.countUp(data.steps)
      });
    });
  }
  componentWillUnmount() {
    // データを永続化
    SharedPreferences.setItem("count", this.state.count.toString());
    SharedPreferences.setItem("updatedAt", this.state.updatedAt);
    SharedPreferences.setItem("noticedAt", this.state.noticedAt);
    this.syncServer();

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
