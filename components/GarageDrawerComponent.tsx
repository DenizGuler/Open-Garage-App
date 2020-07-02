import { useIsDrawerOpen, DrawerContentOptions, DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import React, { FC, useEffect, useState } from "react";
import { getImage } from "../screens/utils";
import { ImageInfo } from "expo-image-picker/build/ImagePicker.types";
import { DrawerDescriptorMap, DrawerNavigationHelpers } from "@react-navigation/drawer/lib/typescript/src/types";
import { DrawerNavigationState } from "@react-navigation/native";
import { Image } from "react-native";

const GarageDrawerComponent: FC<DrawerContentOptions & {
  state: DrawerNavigationState;
  navigation: DrawerNavigationHelpers;
  descriptors: DrawerDescriptorMap;
}> = (props) => {
  const isDrawerOpen = useIsDrawerOpen();
  const [image, setImage] = useState<ImageInfo>();

  useEffect(() => {
    getImage().then((img) => {
      if (img !== undefined)
        setImage(img)
    })
  }, [isDrawerOpen])

  return (
    <DrawerContentScrollView {...props}>
      {image && <Image source={{ uri: image.uri }} style={{
        height: 200,
        width: image.width / image.height * 200,
        alignSelf: 'center',
        borderRadius: 5,
        marginBottom: 5,
      }} />}
      <DrawerItemList
        {...props}
        // navigation={props.navigation}
        itemStyle={{
          width: '100%',
          marginHorizontal: 0,
          marginVertical: 0,
          borderRadius: 0,
          borderColor: '#adacac',
          borderBottomWidth: 1,
          paddingLeft: 0,
        }}
        labelStyle={{
          // position: 'absolute',
          left: -15,
          bottom: -10,
          top: 0,
          // top: '50%'
        }}
        activeBackgroundColor='#adacac'
        activeTintColor='#fff'
      />
    </DrawerContentScrollView>
  )
}

export { GarageDrawerComponent }
export default GarageDrawerComponent