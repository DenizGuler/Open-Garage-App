import React, { FC } from 'react';
import { Portal, Modal, Button } from 'react-native-paper';
import { BaseText as Text } from '../utils/utils'
import { Divider } from 'react-native-elements';
import { FlatList } from 'react-native-gesture-handler';
import { View, Dimensions, Platform } from 'react-native';

export interface PopupOptions {
  catchOnCancel?: boolean,
  title: string,
  text?: string,
  buttons: { text: string, onPress?: () => void }[],
}

const PopupServiceContext = React.createContext<
  (options: PopupOptions) => Promise<void>
>(Promise.reject);

const PopupServiceProvider = ({ children }: any) => {
  const [popupState, setPopupState] = React.useState<PopupOptions | null>(null);

  const awaitingPromiseRef = React.useRef<{
    resolve: () => void,
    reject: () => void,
  }>();

  const openPopup = (options: PopupOptions) => {
    setPopupState(options);
    return new Promise<void>((resolve, reject) => {
      awaitingPromiseRef.current = { resolve, reject };
    });
  };

  const handleClose = () => {
    if (popupState?.catchOnCancel && awaitingPromiseRef.current) {
      awaitingPromiseRef.current.reject();
    }

    setPopupState(null);
  }

  const handleSubmit = () => {
    if (awaitingPromiseRef.current) {
      awaitingPromiseRef.current.resolve();
    }

    setPopupState(null);
  }

  return (
    <>
      <PopupServiceContext.Provider
        value={openPopup}
        children={children}
      />
      <Popup visible={Boolean(popupState)} {...popupState} onDismiss={handleClose} />
    </>
  )
}


interface Props {
  visible: boolean,
  onDismiss: () => void,
  title?: string,
  buttons?: { text: string, onPress?: () => void }[]
  text?: string,
}


/**
 * Popup compenent that doubles as a modal when used on its own.
 */
const Popup: FC<Props> = (props) => {

  return (
    <View
      // ts error from using position: fixed when it doesn't work on non web
      // @ts-ignore
      style={{
        display: props.visible ? 'flex' : 'none',
        position: Platform.OS === 'web' ? 'fixed' : 'absolute',
        height: '100%',
        width: '100%',
      }}
    >
      <Modal visible={props.visible} onDismiss={props.onDismiss}
        contentContainerStyle={{
          maxWidth: 550,
          width: '75%',
          alignSelf: 'center',
          backgroundColor: '#fff',
          paddingHorizontal: 12,
          paddingVertical: 5,
          borderRadius: 4,
          zIndex: 10,
        }}
      >
        <Text style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: '#000000c0',
          paddingVertical: 16,
          paddingHorizontal: 10,
        }}>
          {props.title}
        </Text>
        <Divider style={{ marginHorizontal: 5 }} />
        {props.text && <Text style={{ paddingVertical: 10, paddingHorizontal: 10, fontSize: 16, }}>{props.text}</Text>}
        {props.children}
        <Divider style={{ marginHorizontal: 5 }} />
        <FlatList
          contentContainerStyle={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-around',
            padding: 5,
          }}
          data={props.buttons}
          keyExtractor={(item) => item.text}
          horizontal
          renderItem={({ item }) => (
            <Button mode="text" onPress={() => {
              if (item.onPress !== undefined) item.onPress();
              props.onDismiss();
            }} accessibilityStates>
              {item.text}
            </Button>
          )}
        />
      </Modal>
    </View>
  )
};

const usePopup = () => React.useContext(PopupServiceContext);

export { Popup, PopupServiceProvider, usePopup };
export default Popup;