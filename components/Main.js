
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
import Moment from 'moment';
import Config from 'react-native-config';
import store from 'react-native-simple-store';
SensorManager.startStepCounter(1000);


export default class Main extends Component {
  static navigationOptions = {
    title: '歩数を計測しています....',
  };
  constructor(props) {
    super(props)
    this.state = { id: 0, currentStep: 0, prevTotalStep: 0, updatedAt: null};
    this.countUp = this.countUp.bind(this);
    this.syncServer = this.syncServer.bind(this);
    this.isNextDate = this.isNextDate.bind(this);
    this.resetCount = this.resetCount.bind(this);
  }

  // 歩数を更新する
  countUp(step) {
    // 歩数を累計するロジックは見直す必要あり
    this.setState({ currentStep: step})
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
          count: this.state.prevTotalStep
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

      // 永続化
      store.update('state', {currentStep: 0, updatedAt: current}).then(() => {
        this.setState({ currentStep: 0, updatedAt: current });
      });
    }
  }
  componentDidMount() {
    // 永続化したデータの読み出し
    //
    store.get('state').then((state) => {
      this.setState(state);
      //起動が次の日であれば、カウンタをリセット
      this.resetCount();
      // アプリロード時に毎回同期
      // 初回は0で通知されます
      this.syncServer();

      // stateをできたらカウントを実行する
      DeviceEventEmitter.addListener('StepCounter', (data) => { this.countUp(data.steps) });
      // 開発環境では歩数計は動かないのでタイマーでカウントアップを再現する
      if (Config.SENSOR_MOCK) {
        setInterval(() => {
          this.countUp(this.state.currentStep + 1)
        }, 1500);
      }
    });
  }
  componentWillUnmount() {
    // データを永続化
    store.update('state', {prevTotalStep: this.state.prevTotalStep + this.state.currentStep}).then(() => {
      this.syncServer();
      SensorManager.stopStepCounter();
    });
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
        {this.state.prevTotalStep + this.state.currentStep}歩！
      </Text>
      </View>
    );
  }
}

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
