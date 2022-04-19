import React, { useEffect, useState, useRef } from 'react'
import { FlatList, Animated, View, Platform, Alert } from 'react-native'
import tw, { useDeviceContext } from 'twrnc'
import Feeds from '../components/Home/Feeds';
import Header from '../components/Header/Header';
import SafeArea from '../components/SafeArea';
import { useDispatch, useSelector } from 'react-redux';
import HiAnimation from '../components/LottieAnimation/HiAnimation';
import { getPost } from '../redux/actions/postsAction';
import { signOut, unauthorized } from '../redux/actions/authAction';
import SkeletonFeeds from '../components/Skeleton/FeedsSkeleton'



const HomeScreen = () => {

    useDeviceContext(tw)


    const { firstName, numberOfFollowing, token, userId, unauth } = useSelector(state => state.authReducer)
    const { posts, loadingGetPosts } = useSelector(state => state.postsReducer)
    const dispatch = useDispatch()

    const CONTAINER_HEIGHT = 45;
    const scrollY = useRef(new Animated.Value(0)).current;
    const offsetAnim = useRef(new Animated.Value(0)).current;
    const clampedScroll = Animated.diffClamp(
        Animated.add(
            scrollY.interpolate({
                inputRange: [0 ,1],
                outputRange: [0, 1],
                extrapolateLeft: 'clamp',
            }),
            offsetAnim,
        ),
        0,
        CONTAINER_HEIGHT
    )

    var _clampedScrollValue = 0;
    var _offsetValue = 0;
    var _scrollValue = 0;
    var scrollEndTimer = null;



    useEffect(() => {
        scrollY.addListener(({value}) => {
            const diff = value - _scrollValue;
            _scrollValue = value;
            _clampedScrollValue = Math.min(
                Math.max(_clampedScrollValue * diff, 0),
                CONTAINER_HEIGHT,
            )
        });
        offsetAnim.addListener(({value}) => {
            _offsetValue = value;
        })
    }, []);

    if(numberOfFollowing){
        useEffect(() => {
            dispatch(getPost({token, userId}))
        }, [])
    }
    
    const onMomentumScrollBegin = () => {
        clearTimeout(scrollEndTimer);
    };
    const onMomentumScrollEnd = () => {
        const toValue = _scrollValue > CONTAINER_HEIGHT && _clampedScrollValue > CONTAINER_HEIGHT / 2
            ? _offsetValue + CONTAINER_HEIGHT : _offsetValue - CONTAINER_HEIGHT;
        
        Animated.timing(offsetAnim, {
            toValue, 
            duration: 300,
            useNativeDriver: true
        }).start();
    };
    const onScrollEndDrag = () => {
        scrollEndTimer = setTimeout(onMomentumScrollEnd, 250);
    }

    const headerTranslate = clampedScroll.interpolate({
        inputRange: [0, CONTAINER_HEIGHT],
        outputRange: [0, -CONTAINER_HEIGHT],
        extrapolate: 'clamp'
    })

    if(unauth) {
        return Alert.alert(
            "Session expired",
            "Please log in again",
            [{
                text: "Ok",
                onPress: () => {
                    dispatch(signOut())
                    dispatch(unauthorized(false))
                    return;
                },
              }]
        )
    }
    

    return (
        <View style={[tw`bg-gray-100 h-full`]}>
            <View style={tw`h-full overflow-hidden flex`}>
                <Animated.View style={[tw`absolute top-0 left-0 right-0 z-50`,{height: CONTAINER_HEIGHT}, {transform: [{translateY: headerTranslate}]}]}>
                    <Header />
                </Animated.View>

                {
                    numberOfFollowing ? (
                        loadingGetPosts ? (
                            <SkeletonFeeds />
                        ) : (
                            <Animated.FlatList
                                data={posts}
                                renderItem={(post) => {
                                    return <Feeds post={post} />
                                }}
                                keyExtractor={post => post.postsId}
                                contentContainerStyle={[tw`py-2 pt-[${CONTAINER_HEIGHT}]`]}
                                showsHorizontalScrollIndicator={false}
                                showsVerticalScrollIndicator={false}
                                onScroll={Animated.event(
                                    [{nativeEvent: {contentOffset: {y: scrollY}}}],
                                    {useNativeDriver: true}
                                )}
                                onMomentumScrollBegin={onMomentumScrollBegin}
                                onMomentumScrollEnd={onMomentumScrollEnd}
                                onScrollEndDrag={onScrollEndDrag}
                                scrollEventThrottle={1}
                            /> 

                        )
                    ) : (
                        <View style={tw`bg-gray-50`}>
                            <HiAnimation 
                                h1={`Welcome to Hexa, ${firstName}!`} 
                                h5={`When you follow people, you'll see the photos they post here.`}    
                            />
                        </View>
                    )
                }

            </View>
        </View>
    )
}

export default HomeScreen
