import { getURL, getDevKey, createAlert, getConMethod, getConInput, getDevices, setDeviceParam } from "./utils"
import { ControllerVars, ControllerOptions, ResultJSON, LogJSON } from "./types";
import { NavigationProp, NavigationState } from "@react-navigation/native";

/**
 * Sends a '/jc' call to the controller and returns the resulting JSON
 * @param index (optional) index of the device to pull variables from
 */
export const getControllerVars = async (index?: number): Promise<ControllerVars> => {
  const conMethod = await getConMethod(index);
  const url = await getURL(index);
  let json: ControllerVars = {
    dist: 0,
    door: 2,
    vehicle: 2,
    rcnt: 0,
    fwv: 0,
    name: 'No Device Found',
    mac: 'No Device Found',
    cid: 0,
    rssi: 0,
  };
  if (conMethod === 'BLYNK') {
    const doorResponse = await fetch(url + '/get/V0');
    json.door = JSON.parse((await doorResponse.json())[0]);
    const distResponse = await fetch(url + '/get/V3');
    json.dist = JSON.parse((await distResponse.json())[0]);
    const carResponse = await fetch(url + '/get/V4');
    json.vehicle = JSON.parse((await carResponse.json())[0]);
    const projectResponse = await fetch(url + '/project');
    json.name = (await projectResponse.json()).name;
  } else {
    const response = await fetch(url + '/jc');
    json = await response.json();
  }
  if (json.message !== undefined) {
    throw Error(json.message)
  }
  await setDeviceParam({name: json.name});
  console.log('name: ' + json.name);
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
  await setDeviceParam({name: json.name});
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
export const getLogData = async (index?: number): Promise<LogJSON | undefined> => {
  const conMethod = await getConMethod(index);
  if (conMethod === 'BLYNK') {
    return undefined;
  }
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
  const conMethod = await getConMethod(index);
  // handle blynk case
  const url = await getURL(index);
  const dkey = await getDevKey(index);
  let response;
  if (conMethod === 'BLYNK') {
    response = await fetch(url + '/update/V1?value=1')
    setTimeout(async () => { response = await fetch(url + '/update/V1?value=0') }, 1000)
  } else {
    response = await fetch(url + '/cc?dkey=' + dkey + '&open=1')
  }
  const json = await response.json();
  return json;
}

/**
 * Closes garage door using API calls
 * @param index (optional) index of target device
 */
export const closeDoor = async (index?: number): Promise<ResultJSON> => {
  const conMethod = await getConMethod(index);
  const url = await getURL(index);
  const dkey = await getDevKey(index);
  let response;
  if (conMethod === 'BLYNK') {
    response = await fetch(url + '/update/V1?value=1')
    setTimeout(async () => { response = await fetch(url + '/update/V1?value=0') }, 1000)
  } else {
    response = await fetch(url + '/cc?dkey=' + dkey + '&close=1')
  }
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
export const interpResult = (json: ResultJSON) => {
  // const navigation = useNavigation();
  // only occurs on false OTC Token
  if (json.message !== undefined) {
    return { success: false, error: 'Connection failed', message: json.message }
  }
  // success
  if (json.result === 1) {
    return { success: true, error: 'No Error', message: 'No error has occured!' }
  }
  // unauthorized
  if (json.result === 2) {
    return { success: false, error: 'Invalid or Empty Device Key', message: 'The entered device key was rejected or not present' };
  }
  // mismatch
  if (json.result === 3) {
    return { success: false, error: 'Key Mismatch', message: 'Make sure the entered keys are identical' };
  }
  // data missing
  if (json.result === 16) {
    return { success: false, error: 'Data Missing', message: 'Required Paramaters are missing for item: \'' + json.item + '\'' };
  }
  // out of range
  if (json.result === 17) {
    // createAlert('Out of Range', 'Entered value was out of range for item: \'' + json.item + '\'')
    return { success: false, error: 'Out of Range', message: 'Entered value was out of range for item: \'' + json.item + '\'' };
  }
  // data format error
  if (json.result === 18) {
    return { success: false, error: 'Data Format Error', message: 'Provided data does not match the required format for item: \'' + json.item + '\'' };
  }
  // page not found
  if (json.result === 32) {
    // createAlert('Page Not Found', 'Page not found or requested file missing')
    return { success: false, error: 'Page Not Found', message: 'Page not found or requested file missing' };
  }
  // not permitted
  if (json.result === 48) {
    return { success: false, error: 'Action Not Permitted', message: 'Cannot operate on the requested station' };
  }
  // upload failed
  if (json.result === 64) {
    return { success: false, error: 'Upload Failed', message: 'Over the air update failed' };
  }
  // unknown error code
  return { success: false, error: 'Unknown Error', message: 'An unknown error has occured!' };
}