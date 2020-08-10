import { ImageInfo } from "expo-image-picker/build/ImagePicker.types";

/**
 * Type used to store device data on the app
 */
export type Device = {
  conMethod?: 'IP' | 'OTF',
  conInput?: string,
  devKey?: string,
  image?: ImageInfo,
  name?: string,
}

/**
 * Type used to make controller variable calls
 */
export type ControllerVars = {
  dist: number,
  door: number,
  vehicle: number,
  rcnt: number,
  fwv: number,
  name: string,
  mac: string,
  cid: number,
  rssi: number,
  click?: number,
  close?: number,
  open?: number,
  reboot?: number,
  apmode?: number,
  [key: string]: string | number | undefined,
}

/**
 * Type used to store device options
 */
export type ControllerOptions = {
  fwv?: number,
  mnt?: string,
  dth?: string,
  vth?: string,
  riv?: string,
  alm?: string,
  aoo?: number,
  lsz?: string,
  tsn?: string,
  htp?: string,
  cdt?: string,
  dri?: string,
  sto?: number,
  mod?: number,
  ati?: string,
  ato?: number,
  atib?: string,
  atob?: number,
  noto?: number,
  usi?: number,
  ssid?: string,
  otf?: {
    domain: string,
    port: string,
    token: string,
  },
  name?: string,
  iftt?: {
    token: string,
    trigger: string,
  },
  mqtt?: {
    dmin: string,
    port: string,
    name: string,
    pass: string,
    topic: string,
  },
  dvip?: string,
  gwip?: string,
  subn?: string,
  nkey?: string,
  ckey?: string,
  [key: string]: string | number | object | undefined,
}

export type ResultJSON = {
  result?: number,
  item?: string,
  message?: string,
}

export type LogJSON = {
  name: string,
  time: number,
  logs: [number, number, number][]
  message?: string,
  }