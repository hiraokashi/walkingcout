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
import Config from 'react-native-config';
SensorManager.startStepCounter(1000);


class Login extends Component {
  static navigationOptions = {
    title: 'ログイン',
  };
  constructor(props) {
    super(props)
    this.state = {id: 0, input_id: 0};
    this.login = this.login.bind(this);
    this.isValidId = this.isValidId.bind(this);
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

  isValidId(){
    return this.state.id > 0
  }
  render(){
    const { navigate } = this.props.navigation;
    return (
      <View style={{padding: 10}}>
      {(() => {
        if (!this.isValidId()) {
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
        if (this.isValidId()) {
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
    this.state = { id: 0, count: 0, updatedAt: null , test: ''};
    this.countUp = this.countUp.bind(this);
    this.syncServer = this.syncServer.bind(this);
    this.isNextDate = this.isNextDate.bind(this);
    this.resetCount = this.resetCount.bind(this);
  }

  // 歩数を更新する
  countUp(step) {
    this.setState({ count: step })
  }

  //サーバへ同期する
  syncServer(){
    if (this.state.id > 0) {
      fetch(`${Config.API_ENDPOINT}insurers/${this.state.id}/walk_logs/`, {
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

  // アプリ起動が次の日かどうか
  isNextDate() {
    if (!this.state.updatedAt) {
      this.setState({test: 'aaaaa'})
      return true;
    }
    let current = Moment(new Date()).format('YYYYMMDD');
    let recent = Moment(this.state.updatedAt).format('YYYYMMDD');
    if (current != recent) {
      return true;
    }
    return false;
  }

  // カウンターをリセット
  resetCount() {
    if (this.isNextDate()) {
      let current = Moment(new Date()).format('YYYYMMDD')
      SharedPreferences.setItem("count",'0');
      SharedPreferences.setItem("updatedAt",current);
      this.setState({ count: 0, updatedAt: current });
    }
  }
  componentDidMount() {
    // 永続化したデータの読み出し
    SharedPreferences.getItems(['id', "count", "updatedAt"] , (values) =>  {
      this.setState({id: parseInt(values[0]), count: parseInt(values[1]), updatedAt: values[2]});
      //起動が次の日であれば、カウンタをリセット
      this.resetCount();
      // アプリロード時に毎回同期
      // 初回は0で通知されます
      this.syncServer();

      // stateをできたらカウントを実行する
      DeviceEventEmitter.addListener('StepCounter', (data) => { this.countUp(data.steps) });
      // 開発環境では歩数計は動かないのでタイマーでカウントアップを再現する
      if (Config.SENSOR_MOCK) {
        setInterval(() => { this.countUp(this.state.count + 1) }, 1500);
      }
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
