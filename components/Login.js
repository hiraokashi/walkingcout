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
import store from 'react-native-simple-store';


export default class Login extends Component {
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

    store.get('state').then((state) => {
      if (state && state.id) {
        this.setState({id: state.id});
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
    store.update('state', {id: this.state.input_id, count: 0}).then(() => {
      this.setState({id: this.state.input_id});
      navigate('Main');
    });
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
