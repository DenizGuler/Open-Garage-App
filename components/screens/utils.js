import { AsyncStorage } from "react-native";

export const getDevKey = async () => {
  try {
    const devKey = await AsyncStorage.getItem('devKey')
    if (devKey !== null)
      return devKey
  } catch (err) {
    console.log(err)
  }
}

export const getOGIP = async () => {
  try {
    const OGIP = await AsyncStorage.getItem('OGIP');
    if (OGIP !== null) {
      return OGIP
    }
  } catch (error) {
    console.log(error)
  }
}