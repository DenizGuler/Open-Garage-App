import { useIsDrawerOpen, DrawerContentOptions } from "@react-navigation/drawer";
import React, { FC, useEffect, useState } from "react";
import { getImage } from "../utils/utils";
import { ImageInfo } from "expo-image-picker/build/ImagePicker.types";
import { DrawerDescriptorMap, DrawerNavigationHelpers } from "@react-navigation/drawer/lib/typescript/src/types";
import { DrawerNavigationState } from "@react-navigation/native";
import { Image, Platform } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import FullLengthButton from "./FullLengthButton";
import { SafeAreaView } from "react-native-safe-area-context";

type GarageDrawerItemProps = {
  active: boolean,
  label: string,
  onPress: () => void,
  // icon: string,
}

const GarageDrawerItem: FC<GarageDrawerItemProps> = (props) => {
  let icon = ''
  switch (props.label) {
    case 'Home':
      icon = 'home';
      break;
    case 'Settings':
      icon = 'settings';
      break;
    case 'Logs':
      icon = 'script';
      break;
    case 'Sites':
      icon = 'swap-horizontal-bold';
      break;
    default:
      break;
  }
  return (
    <FullLengthButton
      text={props.label}
      icon={{ name: icon }}
      onPress={props.onPress}
      style={{ height: 50, fontSize: 16 }}
      backgroundColor={props.active ? '#e5e5e5' : undefined}
    />)
}

const GarageDrawerComponent: FC<DrawerContentOptions & {
  state: DrawerNavigationState;
  navigation: DrawerNavigationHelpers;
  descriptors: DrawerDescriptorMap;
}> = (props) => {
  const isDrawerOpen = useIsDrawerOpen();
  const [image, setImage] = useState<ImageInfo | undefined>();

  useEffect(() => {
    getImage().then((img) => {
      setImage(img)
    })
  }, [isDrawerOpen]);

  return (
    <SafeAreaView {...props}>
      {image && <Image source={{ uri: image.uri }} style={{
        height: 200,
        width: Platform.OS === 'web' ? 310 : image.width / image.height * 200,
        alignSelf: 'center',
        borderRadius: 5,
        marginVertical: 5,
      }} />}
      <FlatList
        data={props.state.routes}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <GarageDrawerItem
            active={(props.state.routeNames[props.state.index]) === item.name}
            label={item.name}
            onPress={() => { props.navigation.navigate(item.name) }}
          />
        )}
      />
    </SafeAreaView>
  )
}

export { GarageDrawerComponent }
export default GarageDrawerComponent