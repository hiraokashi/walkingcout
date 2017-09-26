
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  DeviceEventEmitter, // will emit events that you can listen to
  Alert
} from 'react-native';
import { StackNavigator } from 'react-navigation';
import { SensorManager } from 'NativeModules';
import Moment from 'moment';
import 'moment/locale/ja';
import Config from 'react-native-config';
import store from 'react-native-simple-store';
SensorManager.startStepCounter(1000);
import { BackHandler } from 'react-native';

export default class Main extends Component {
  static navigationOptions = {
    title: '歩数を計測しています....',
  };
  constructor(props) {
    super(props)
    this.state = { id: 0, currentStep: 0, prevTotalStep: 0, offsetStep: 0, updatedAt: null};
    this.countUp = this.countUp.bind(this);
    this.syncServer = this.syncServer.bind(this);
    this.isNextDate = this.isNextDate.bind(this);
    this.resetCount = this.resetCount.bind(this);
    this.save = this.save.bind(this);
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
      //fetch(`https://health-point-staging.herokuapp.com/api/v1/insurers/${this.state.id}/walk_logs/`, {
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
      store.update('state', {prevTotalStep: 0, currentStep: 0, offsetStep: 0, updatedAt: current}).then(() => {
        this.setState({prevTotalStep: 0,  currentStep: 0, offsetStep: 0, updatedAt: current });
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
      DeviceEventEmitter.addListener('StepCounter', (data) => {
        // Androidのステップカウンタはカウントがクリアされないので初期値からの差分を歩数とみなす
        if (this.isNextDate()) {
          this.setState({offsetStep: Math.floor(data.steps)});
        } else {
          this.countUp(Math.floor(data.steps - this.state.offsetStep));
        }
      });
      // 開発環境では歩数計は動かないのでタイマーでカウントアップを再現する
      //if (Config.SENSOR_MOCK) {
      //  setInterval(() => {
      //    this.countUp(this.state.currentStep + 1)
      //  }, 1500);
      //}
      BackHandler.addEventListener('hardwareBackPress', () => {
        //戻るボタンでも保存する
        this.save();
        return false; // Don't exit the app.
      });
    });
  }
  componentWillUnmount() {
    this.save();
  }
  save(){
    // データを永続化
    store.update('state', {prevTotalStep: this.state.prevTotalStep + this.state.currentStep, offsetStep: this.state.offsetStep}).then(() => {
      this.syncServer();
      SensorManager.stopStepCounter();
    });
  }
  render() {
    const { navigate } = this.props.navigation;
    Moment.locale('ja');
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerId}>
           ユーザID: {this.state.id}
          </Text>
          <Text style={styles.headerDate}>
           {Moment(new Date()).format('YYYY年MM月DD日')}
          </Text>
        </View>
        <View style={styles.contentsContainer}>
          <Text style={styles.title}>
           歩数
          </Text>
          <Text style={styles.count}>
            {String(this.state.prevTotalStep + this.state.currentStep).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,').toLocaleString()}
          </Text>
          <Text style={styles.unit}>
           歩
          </Text>
        </View>
        <View style={styles.dummyContainer}>
        </View>
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
    paddingTop: 5,
  },
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7BFB9',
    flexDirection: 'row',
    margin: 5,
    borderRadius: 2,
  },
  headerId: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 20,
    marginLeft: 20,
    color: '#F5FCFF',
  },
  headerDate: {
    flex: 1,
    justifyContent: 'center',
    fontSize: 20,
    alignItems: 'center',
    color: '#F5FCFF',
  },
  contentsContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F97163',
    flexDirection: 'row',
    margin: 5,
    borderRadius: 5,
  },
  title: {
    flex: 2,
    fontSize: 20,
    textAlign: 'left',
    textAlignVertical: 'top',
    paddingBottom: 40,
    marginLeft: 20,
    color: '#F5FCFF',
  },
  count: {
    flex: 5,
    textAlign: 'right',
    color: '#333333',
    paddingBottom: 24,
    marginBottom: 5,
    fontSize: 50,
    color: '#F5FCFF',
  },
  unit: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'bottom',
    color: '#333333',
    paddingTop: 0,
    marginRight: 30,
    color: '#F5FCFF',
  },
  dummyContainer: {
    flex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    flexDirection: 'row',
  },
});
