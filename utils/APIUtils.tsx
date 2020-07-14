import { getURL, getDevKey } from "./utils"
import { ControllerVars, ControllerOptions, APIResult } from "./types";

/**
 * Sends a '/jc' call to the controller and returns the resulting JSON
 * @param index (optional) index of the device to pull variables from
 */
export const getControllerVars = async (index?: number) => {
  const url = await getURL(index);
  const response = await fetch(url + '/jc');
  const json = await response.json();
  return json;
}

/**
 * Sends a '/cc' call to the controller and returns the resulting JSON
 * @param vars variables to change
 * @param index (optional) index of target device
 */
export const changeControllerVars = async (vars: ControllerVars, index?: number) => {
  const url = await getURL(index);
  const dkey = await getDevKey(index);
  let req = url + '/cc?dkey=' + dkey;
  Object.keys(vars).forEach((key: string) => {
    let param = vars[key]
    if (param !== undefined){
      req += '&'+ key + '=' + encodeURIComponent(param)
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
export const getControllerOptions = async (index?: number) => {
  const url = await getURL(index);
  const response = await fetch(url + '/jo');
  const json = response.json();
  return json
}

/**
 * Sends a '/co' call to the controller and returns the resulting JSON
 * @param options options to change
 * @param index (optional) index of target device
 */
export const changeControllerOptions = async (options: ControllerOptions, index?: number) => {
  const url = await getURL(index);
  const dkey = await getDevKey(index);
  let req = url + '/co?dkey=' + dkey;
  Object.keys(options).forEach((key: string) => {
    let param = options[key]
    if (param !== undefined){
      req += '&'+ key + '=' + encodeURIComponent(param)
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
export const getLogData = async (index?: number) => {
  const url = await getURL(index);
  const response = await fetch(url + '/jl')
  const json = response.json();
  return json;
}

/**
 * Clears log data with the '/clearlog' call
 * @param index (optional) index of target device
 */
export const clearLogData = async (index?: number) => {
  const url = await getURL(index);
  const dkey = await getDevKey(index);
  const response = await fetch(url + '/clearlog?dkey=' + dkey)
  const json = response.json();
  return json;
}

/**
 * Resets device to factory settings with the '/resetall' call
 * @param index (optional) index of target device
 */
export const resetAll = async (index?: number) => {
  const url = await getURL(index);
  const dkey = await getDevKey(index);
  const response = await fetch(url + '/resetall?dkey=' + dkey)
  const json = response.json();
  return json;
}