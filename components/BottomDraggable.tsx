import React from 'react';
import Animated, { Easing } from "react-native-reanimated";
import { State, PanGestureHandler, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { View, StyleSheet } from 'react-native';

const {
  event,
  set,
  defined,
  lessOrEq,
  eq,
  neq,
  and,
  add,
  multiply,
  cond,
  clockRunning,
  Clock,
  Value,
  stopClock,
  startClock,
  spring,
  timing,
  block,
  debug,
} = Animated;

function runTiming(clock: Animated.Clock, value: Animated.Adaptable<any>, dest: Animated.Adaptable<any>) {
  const state = {
    finished: new Value(1),
    position: new Value(value),
    time: new Value(0),
    frameTime: new Value(0),
  };

  const config = {
    duration: 1000,
    toValue: new Value(dest),
    easing: Easing.inOut(Easing.ease),
  };

  const reset = [
    set(state.finished, 0),
    set(state.time, 0),
    set(state.frameTime, 0),
  ];

  return block([
    cond(and(state.finished, eq(state.position, value)), [
      ...reset,
      set(config.toValue, dest),
    ]),
    cond(and(state.finished, eq(state.position, dest)), [
      ...reset,
      set(config.toValue, value),
    ]),
    cond(clockRunning(clock), 0, startClock(clock)),
    timing(clock, state, config),
    state.position,
  ]);
}

function runSpring(clock: Animated.Clock, value: Animated.Adaptable<any>, velocity: Animated.Adaptable<number> | number, dest: Animated.Adaptable<number>) {
  const state = {
    finished: new Value(0),
    velocity: new Value(0),
    position: new Value(0),
    time: new Value(0)
  };

  const config = {
    damping: 12,
    mass: 1,
    stiffness: 121.6,
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
    toValue: new Value(0)
  };
  return [
    cond(clockRunning(clock), 0, [
      set(state.finished, 0),
      set(state.velocity, velocity),
      set(state.position, value),
      set(config.toValue, dest),
      startClock(clock)
    ]),
    spring(clock, state, config),
    cond(state.finished, stopClock(clock)),
    state.position
  ];
}

type BottomDraggableProps = {
  minHeight: number,
  maxHeight: number,
  threshold: number,
  thresholdGive: number,
  minimizedComponent: (props: any) => React.ReactElement,
  maximizedComponent: (props: any) => React.ReactElement,
}

class BottomDraggable extends React.Component<BottomDraggableProps>{
  translateY: Animated.Node<any>;
  snapped: Animated.Value<State>;
  snapPoint: Animated.Value<number>;
  minOpacity: Animated.Value<number>;
  maxOpacity: Animated.Value<number>;
  handleRotation: Animated.Node<number>;
  getSnapPoint: (currPos: any) => Animated.Node<any>;
  onGestureEvent: (...args: any[]) => void;
  // toggleDraggable: () => void;


  constructor(props: BottomDraggableProps) {
    super(props);
    this.translateY = new Value(props.minHeight);
    this.minOpacity = new Value(1);
    this.maxOpacity = new Value(0);
    this.handleRotation = new Value(15);
    const dragY = new Value(0);
    const dragVY = new Value(0);
    const absY = new Value(0);
    const state = new Value(State.UNDETERMINED);
    // this.snapped = false;
    this.snapped = new Value(0);
    this.snapPoint = new Value(props.minHeight);

    const clock = new Clock();
    const thresh = new Value(props.threshold * (1 - props.thresholdGive));
    this.getSnapPoint = (currPos) => {
      // set(this.snapped, false)
      return cond(
        lessOrEq(currPos, thresh)
        , [
          // this.snapped = false,
          // this.snapped.setValue(false),
          set(this.snapped, 0),
          set(thresh, props.threshold * (1 - props.thresholdGive)),
          set(this.snapPoint, props.minHeight),
          // set(this.handleRotation, 15),
          set(this.minOpacity, 1),
          set(this.maxOpacity, 0),
          this.snapPoint
        ]
        , [
          set(this.snapped, 1),
          // this.snapped = true,
          set(thresh, props.threshold * (1 + props.thresholdGive)),
          set(this.snapPoint, props.maxHeight),
          // set(this.handleRotation, 0),
          set(this.maxOpacity, 1),
          set(this.minOpacity, 0),
          this.snapPoint
        ])
    }

    this.onGestureEvent = event([{
      nativeEvent: {
        absoluteY: absY,
        translationY: dragY,
        velocityY: dragVY,
        state: state
      }
    }])

    const transY = new Value();
    // const oldSnapped = new Value(false);

    this.translateY = cond(eq(state, State.ACTIVE), [
      // state active
      stopClock(clock),
      // set(oldSnapped, this.snapped),
      // set(transY, sub(Dimensions.get('window').height, absY)),
      cond(eq(this.snapped, 1),
        // transY = -dragY + maxHeight
        set(transY, add(multiply(dragY, -1), props.maxHeight)),
        // transY = -dragY + minHeight
        set(transY, add(multiply(dragY, -1), props.minHeight))),
      transY
    ], [
      // state inactive
      // this.getSnapPoint(transY),
      set(
        transY,
        cond(defined(transY), runSpring(clock, transY, 5, this.getSnapPoint(transY)), props.minHeight),
        // debug('transY ', transY),
      )
    ]);

    const rot = new Value();
    this.handleRotation = cond(eq(this.snapped, 1), [
      debug('rot', rot),
      set(
        rot,
        cond(defined(rot), runTiming(clock, rot, 0), 0)
      ),
      new Value(0)
    ], [
      
      set(
        rot,
        cond(defined(rot), runTiming(clock, rot, 15), 15)
      ),
      new Value(15)
    ])

    // this.toggleDraggable = () => {
    //   console.log('wtf')
    //   cond(and(eq(state, State.END), eq(this.snapped, 0)), [
    //     // debug('transY', this.translateY),
    //     stopClock(clock),
    //     set(
    //       transY,
    //       runSpring(clock, transY, 200, this.props.minHeight),
    //     ),
    //     set(this.snapped, 1),
    //     transY
    //   ], [
    //     stopClock(clock),
    //     // set(state, State.ACTIVE),
    //     set(
    //       transY,
    //       runSpring(clock, transY, 200, this.props.maxHeight),
    //     ),
    //     set(this.snapped, 0),
    //     transY
    //   ])
    // }
    // this.translateY = cond(eq(this.snapped, false), [
    //   stopClock(clock),
    //   runSpring(clock, this.translateY, 5, 500),
    //   // set(this.snapped, true),
    //   // this.translateY
    // ], [
    //   stopClock(clock),
    //   runSpring(clock, this.translateY, -5, 100),
    //   // set(this.snapped, false),
    // ])
  }


  render() {
    return (
      <PanGestureHandler
        onGestureEvent={this.onGestureEvent}
        onHandlerStateChange={this.onGestureEvent}
      // failOffsetY={[-this.props.height * 1.25, this.props.height * 1.25]}
      >
        <Animated.View
          style={{
            // position: 'absolute',
            bottom: 0,
            width: '100%',
            height: this.translateY,
            paddingTop: 5,
            marginTop: -5,
            overflow: 'hidden',
            // transform: [{ translateY: this.translateY }]
          }}
        >
          <View style={{
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: -1,
            },
            shadowOpacity: 0.23,
            shadowRadius: 2.62,
            borderRadius: 20,
            elevation: 4,
          }}>
            <View style={{
              height: '100%',
              width: '100%',
              backgroundColor: 'white',
              marginTop: 4,
              borderTopRightRadius: 20,
              borderTopLeftRadius: 20,
            }}>
              <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
                <Animated.View
                  style={[styles.handle, {
                    // rotation: multiply(this.handleRotation, -1)
                  }]}
                />
                <Animated.View
                  style={[styles.handle, {
                    // rotation: this.handleRotation
                  }]}
                />
              </View>
              <Animated.View
                style={{
                  position: 'absolute',
                  opacity: this.minOpacity,
                  alignSelf: 'center',
                  top: '25%',
                }}
              >
                <this.props.minimizedComponent />
              </Animated.View>
              <Animated.View
                style={{
                  width: '100%',
                  position: 'absolute',
                  opacity: this.maxOpacity,
                  alignSelf: 'center',
                  top: 15,
                }}
              >
                <this.props.maximizedComponent />
              </Animated.View>
            </View>
          </View>
        </Animated.View>
      </PanGestureHandler>
    )
  }
}

const styles = StyleSheet.create({
  handle: {
    height: 4,
    borderRadius: 2,
    width: '10%',
    backgroundColor: '#aaa',
    alignSelf: 'center',
    marginTop: 12,
    marginRight: -4,
  }
})

export { BottomDraggable };
export default BottomDraggable;