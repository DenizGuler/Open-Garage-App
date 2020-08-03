import React, { FC, useState } from 'react';
import { Theme, withTheme } from 'react-native-paper';
import SliderBase, { SliderProps } from '@react-native-community/slider';
import { View, TextInput } from 'react-native';

const Slider: FC<SliderProps & { theme: Theme, withFeedBack?: boolean }> = (props) => {
  const [value, setValue] = useState(props.value);
  const [textValue, setTextValue] = useState(String(props.value))
  return (
    <View
      style={{
        width: '100%',
        padding: 8,
        height: 52,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center'
      }}
    >
      <SliderBase
        thumbTintColor={props.theme.colors.accent}
        maximumTrackTintColor={props.theme.colors.onBackground}
        minimumTrackTintColor={props.theme.colors.accent}
        style={{ flexGrow: 2 }}
        {...props}
        value={value}
        onValueChange={(val) => {
          setValue(val);
          setTextValue(String(val));
        }}
      />
      {props.withFeedBack && <TextInput
        style={{
          fontSize: 16,
          backgroundColor: '#fff',
          width: 60,
          height: 43,
          textAlign: 'center',
          color: '#000000',
          borderColor: '#00000020',
          borderWidth: 2,
          borderRadius: 6,
        }}
        value={textValue}
        onChangeText={(text) => {
          setTextValue(text)
          isNaN(Number(text)) ? undefined :  setValue(Number(text))
        }}
        onSubmitEditing={(text) => props.onSlidingComplete ? props.onSlidingComplete(Number(text)) : undefined}
        // onEndEditing={(e) => {
        //   props.onSlidingComplete? props.onSlidingComplete(Number(textValue)) : undefined
        // }}
        keyboardType={'number-pad'}
        selectTextOnFocus
      />}
    </View>
  )
}

export { Slider };
export default withTheme(Slider);