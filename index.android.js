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
  TextInput,
  View,
  Button,
  DeviceEventEmitter // will emit events that you can listen to
} from 'react-native';
import { StackNavigator } from 'react-navigation';
import { SensorManager } from 'NativeModules';
import SharedPreferences from 'react-native-shared-preferences';
import Moment from 'moment';
SensorManager.startStepCounter(1000);


class Login extends Component {
  static navigationOptions = {
    title: 'ログイン',
  };
  constructor(props) {
    super(props)
    this.state = {id: 0, input_id: 0};
    this.login = this.login.bind(this)
  }
  componentDidMount() {
    // 永続化したデータの読み出し
    // ログイン済みなら歩数画面へ遷移
    const { navigate } = this.props.navigation;

    SharedPreferences.getItem("id", (value) => {
      if (value) {
        this.setState({id: parseInt(value)});
        navigate('Main');
      }
    });
  }
  render(){
    const { navigate } = this.props.navigation;
    return (
      <View style={{padding: 10}}>
      {(() => {
        if (this.state.id <= 0) {
          return (
            <View style={{padding: 10}}>
            <TextInput
            style={{height: 40}}
            placeholder="IDを入力してください"
            onChangeText={(input_id) => this.setState({input_id: parseInt(input_id)})}
            />
            <Button
            onPress={() => this.login()}
            title="ログイン"
            accessibilityLabel="Learn more about this purple button"
            />
            </View>
          );
        } 
      })()}
      {(() => {
        if (this.state.id > 0) {
          return (
            <View style={{padding: 10}}>
            <Text>
            ID: {this.state.id}
            </Text>
            <Text>
            ようこそ！
            </Text>
            <Button
            onPress={() => navigate('Main')}
            title="歩数計測を開始する"
            accessibilityLabel="Learn more about this purple button"
            />
            <Text style={{marginTop: 350}}>
            </Text>
            <Button 
            color="#DDD"
            onPress={() => this.setState({id: 0})}
            title="IDリセット"
            accessibilityLabel="Learn more about this purple button"
            />
            </View>
          );
        }
      })()}
        </View>
      );
  }

  login(){
    // 1.フォームデータを取得
    // フォームの情報を永続化しておく
    const { navigate } = this.props.navigation;
    SharedPreferences.setItem("id",this.state.input_id.toString());
    SharedPreferences.setItem("count",'0');
    this.setState({id: this.state.input_id});
    navigate('Main');
  }
}


class Main extends Component {
  static navigationOptions = {
    title: '歩数を計測しています....',
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
        return [];
      })
      .catch((error) => {
        console.log(error);
      })
    }
  }
  componentDidMount() {
    // 永続化したデータの読み出し
    SharedPreferences.getItems(['id', "count"] , (values) =>  {
      this.setState({id: parseInt(values[0]), count: parseInt(values[1])});
      // アプリロード時に毎回同期
      this.syncServer();

      // stateをできたらカウントを実行する
      DeviceEventEmitter.addListener('StepCounter', (data) => {
        /**
         * data.steps
         **/
        this.countUp(data.steps)
      });
      setInterval(() => {
        this.countUp(this.state.count + 1)
      }, 1500);
    });
  }
  componentWillUnmount() {
    // データを永続化
    SharedPreferences.setItem("count", this.state.count.toString());
    this.syncServer();

    SensorManager.stopStepCounter();
  }
  render() {
    const { navigate } = this.props.navigation;
    Moment.locale('ja');
    return (
      <View style={styles.container}>
      <Text style={styles.instructions}>
      ID: {this.state.id} 
      </Text>
      <Text style={styles.instructions}>
      {Moment(new Date()).format('YYYY年MM月DD日')} 
      </Text>
      <Text style={styles.welcome}>
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
