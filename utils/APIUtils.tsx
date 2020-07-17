import { getURL, getDevKey, createAlert } from "./utils"
import { ControllerVars, ControllerOptions, ResultJSON, LogJSON } from "./types";
import { NavigationProp, NavigationState } from "@react-navigation/native";

/**
 * Sends a '/jc' call to the controller and returns the resulting JSON
 * @param index (optional) index of the device to pull variables from
 */
export const getControllerVars = async (index?: number) => {
  const url = await getURL(index);
  const response = await fetch(url + '/jc');
  const json = await response.json();
  if (json.message !== undefined) throw Error(json.message)
  return json;
}

/**
 * Sends a '/cc' call to the controller and returns the resulting JSON
 * @param vars variables to change
 * @param index (optional) index of target device
 */
export const changeControllerVars = async (vars: ControllerVars, index?: number): Promise<ResultJSON> => {
  const url = await getURL(index);
  const dkey = await getDevKey(index);
  let req = url + '/cc?dkey=' + dkey;
  Object.keys(vars).forEach((key: string) => {
    let param = vars[key]
    if (param !== undefined) {
      req += '&' + key + '=' + encodeURIComponent(param)
    }
  });
  const response = await fetch(req);
  const json = await response.json();
  return json
}

/**
 * Sends a '/jo' call to the controller and returns the resulting JSON
 * @param index (optional) index of device to pull options from
 */
export const getControllerOptions = async (index?: number): Promise<ControllerOptions> => {
  const url = await getURL(index);
  const response = await fetch(url + '/jo');
  const json = await response.json();
  if (json.message !== undefined) throw Error(json.message)
  return json
}

/**
 * Sends a '/co' call to the controller and returns the resulting JSON
 * @param options options to change
 * @param index (optional) index of target device
 */
export const changeControllerOptions = async (options: ControllerOptions, index?: number): Promise<ResultJSON> => {
  const url = await getURL(index);
  const dkey = await getDevKey(index);
  let req = url + '/co?dkey=' + dkey;
  Object.keys(options).forEach((key: string) => {
    let param = options[key]
    if (param !== undefined) {
      req += '&' + key + '=' + encodeURIComponent(param)
    }
  });
  const response = await fetch(req);
  const json = await response.json();
  return json
}

/**
 * Grabs log data with the '/jl' call
 * @param index (optional) index of target device
 */
export const getLogData = async (index?: number): Promise<LogJSON> => {
  const url = await getURL(index);
  const response = await fetch(url + '/jl')
  const json = await response.json();
  return json;
}

/**
 * Clears log data with the '/clearlog' call
 * @param index (optional) index of target device
 */
export const clearLogData = async (index?: number): Promise<ResultJSON> => {
  const url = await getURL(index);
  const dkey = await getDevKey(index);
  const response = await fetch(url + '/clearlog?dkey=' + dkey)
  const json = await response.json();
  return json;
}

/**
 * Resets device to factory settings with the '/resetall' call
 * @param index (optional) index of target device
 */
export const resetAll = async (index?: number): Promise<ResultJSON> => {
  const url = await getURL(index);
  const dkey = await getDevKey(index);
  const response = await fetch(url + '/resetall?dkey=' + dkey)
  const json = await response.json();
  return json;
}

/**
 * Opens garage door using API calls
 * @param index (optional) index of target device
 */
export const openDoor = async (index?: number): Promise<ResultJSON> => {
  const url = await getURL(index);
  const dkey = await getDevKey(index);
  const response = await fetch(url + '/cc?dkey=' + dkey + '&open=1')
  const json = await response.json();
  return json;
}

/**
 * Closes garage door using API calls
 * @param index (optional) index of target device
 */
export const closeDoor = async (index?: number): Promise<ResultJSON> => {
  const url = await getURL(index);
  const dkey = await getDevKey(index);
  const response = await fetch(url + '/cc?dkey=' + dkey + '&close=1')
  const json = await response.json();
  return json;
}

export const issueCommand = async (command: 'clearlog' | 'reboot' | 'apmode', index?: number): Promise<ResultJSON> => {
  const url = await getURL(index);
  const dkey = await getDevKey(index);
  let req = url
  switch (command) {
    case 'clearlog':
      req += '/clearlog?dkey=' + dkey;
      break;
    case 'reboot':
      req += '/cc?dkey=' + dkey + '&reboot=1';
      break;
    case 'apmode':
      req += '/cc?dkey=' + dkey + '&apmode=1';
      break;
    default:
      req = ''
      break;
  }
  // this looks redundant
  if (req === undefined) req = ''
  const response = await fetch(req)
  const json = await response.json();
  return json
}


/**
 * interprets the result value of the passed JSON 
 * @param json JSON returned by an OpenGarage API call
 */
export const interpResult = (json: ResultJSON, navigation: NavigationProp<Record<string, object | undefined>, string, NavigationState, {}, {}>) => {
  // const navigation = useNavigation();
  // only occurs on false OTC Token
  if (json.message !== undefined) {
    createAlert('Connection failed', json.message,
      [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('IPSettings') }])
    return false
  }
  // success
  if (json.result === 1) {
    return true
  }
  // unauthorized
  if (json.result === 2) {
    createAlert('Invalid or Empty Device Key', 'The entered device key was rejected or not present',
      [{ text: 'Cancel' }, { text: 'Go to Settings', onPress: () => navigation.navigate('IPSettings') }])
    return false
  }
  // mismatch
  if (json.result === 3) {
    createAlert('Key Mismatch', 'Make sure the entered keys are identical')
    return false
  }
  // data missing
  if (json.result === 16) {
    createAlert('Data Missing', 'Required Paramaters are missing for item: \'' + json.item + '\'')
    return false
  }
  // out of range
  if (json.result === 17) {
    createAlert('Out of Range', 'Entered value was out of range for item: \'' + json.item + '\'')
    return false
  }
  // data format error
  if (json.result === 18) {
    createAlert('Data Format Error', 'Provided data does not match the required format for item: \'' + json.item + '\'')
    return false
  }
  // page not found
  if (json.result === 32) {
    createAlert('Page Not Found', 'Page not found or requested file missing')
    return false
  }
  // not permitted
  if (json.result === 48) {
    createAlert('Action Not Permitted', 'Cannot operate on the requested station')
    return false
  }
  // upload failed
  if (json.result === 64) {
    createAlert('Upload Failed', 'Over the air update failed')
    return false
  }
  // unknown error code
  createAlert('Unknown Error', 'An unknown error has occured!')
  return false
}