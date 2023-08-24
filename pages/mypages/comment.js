/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useRef, useState} from 'react';
import {ScrollView, View, Text, StyleSheet, TextInput} from 'react-native';
import {useSelector} from 'react-redux';
import axiosInstance from '../../utils/axiosInstance';
import Icon from 'react-native-vector-icons/Feather';
import Icon2 from 'react-native-vector-icons/MaterialCommunityIcons';

import {TouchableOpacity} from 'react-native-gesture-handler';

export default function MyCommentPage({navigation, route}) {
  const userId = useSelector(state => state.USER);
  const [commentContents, setCommentContents] = useState(null);
  const [modifying, setModifying] = useState('');
  const [modifyIndex, setModifyIndex] = useState(null);
  const [page, setPage] = useState(0);
  const [isEndOfScroll, setIsEndOfScroll] = useState(false);
  const scrollViewRef = useRef(null);

  const [videoData, setVideoData] = useState([]);
  useEffect(() => {
    getUserComment();
  }, []);

  useEffect(() => {
    if (isEndOfScroll) {
      setPage(prevPage => prevPage + 1);
    }
  }, [isEndOfScroll]);

  const getUserComment = async () => {
    try {
      console.log('userId in getUserComment : ', userId);
      const response = await axiosInstance.get(
        `comment-service/comments/user?userId=${userId}&page=${page}&size=10`,
      );
      const videoIds = response.data.payload.comments.map(item => item.videoId);
      setCommentContents(response.data.payload);
      getVideoData(videoIds);
    } catch (e) {
      console.log(e);
    }
  };

  const getVideoData = async videoIds => {
    try {
      const idsString = videoIds.join(',');
      const response = await axiosInstance.get(
        `content-slave-service/videos/videoIds?q=${idsString}`,
      );

      setVideoData(response.data.payload.videos);
    } catch (e) {
      console.log(e);
    }
  };

  const modifyComment = async e => {
    try {
      const response = await axiosInstance.put(
        `comment-service/comments/${e.videoId}/${e.commentId}`,
        {
          userId: userId,
          content: modifying,
        },
      );
      getUserComment();
    } catch (error) {
      console.log(error);
    }
  };

  const deleteComment = async e => {
    try {
      const response = await axiosInstance.put(
        `comment-service/comments/${e.videoId}/${e.commentId}/delete`,
        {
          userId: userId,
        },
      );
      setCommentContents(prevState => ({
        ...prevState,
        comments: prevState.comments.filter(
          comment => comment.commentId !== e.commentId,
        ),
      }));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>내가 쓴 댓글</Text>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.contentsContainer}>
          {commentContents &&
            commentContents.comments.map((e, i) => {
              const matchingVideo = videoData.find(
                v => v.videoId === e.videoId,
              );
              const videoNickname = matchingVideo
                ? matchingVideo.videoName
                : 'Unknown';
              return (
                <>
                  <View key={i} style={styles.commentBox}>
                    <View style={styles.infoContainer}>
                      <Text style={styles.videoName}>{videoNickname}</Text>
                      <Text style={styles.commentCreatedAt}>
                        {e.createdAt.split('T')[0]}
                      </Text>
                      <Text style={styles.commentContents}>{e.content}</Text>
                    </View>
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate('Play', {video: matchingVideo})
                        }>
                        <Icon name="play-circle" size={31} color={'#919191'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          if (modifyIndex === i) {
                            setModifyIndex(null);
                            setModifying('');
                          } else {
                            setModifyIndex(i);
                          }
                        }}>
                        <Icon name="edit" size={31} color={'#919191'} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteComment(e)}>
                        <Icon name="trash" size={31} color={'#919191'} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {modifyIndex === i && (
                    <View key={i + 100}>
                      <View style={styles.modfiyCommentContainer}>
                        <Icon2 name="arrow-up-left" size={25} color={'black'} />
                        <TextInput
                          style={styles.commentModifyInput}
                          placeholder="댓글 수정"
                          placeholderTextColor={'#c9c9c9'}
                          onChangeText={text => setModifying(text)}
                          value={modifying}
                          onSubmitEditing={() => {
                            modifyComment(e);
                            setModifyIndex(null);
                            setModifying('');
                          }}
                        />
                        <TouchableOpacity
                          onPress={() => {
                            modifyComment(e);
                            setModifyIndex(null);
                            setModifying('');
                          }}>
                          <Icon name="send" size={25} color={'black'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            setModifyIndex(null);
                            setModifying('');
                          }}>
                          <Icon2 name="close" size={25} color={'black'} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              );
            })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
  },
  contentsContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 23,
    color: 'black',
    marginLeft: 20,
    fontWeight: '400',
    width: 120,
    marginBottom: 20,
    fontFamily: 'AppleSDGothicNeoB00',
  },
  commentBox: {
    flexDirection: 'row',
    width: '95%',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingLeft: 10,
    paddingVertical: 10,
    marginBottom: 10,
  },
  infoContainer: {
    justifyContent: 'space-between',
    width: '65%',
    borderRightWidth: 0.5,
    paddingHorizontal: 5,
    borderStyle: 'dashed',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '32%',
    paddingHorizontal: 2,
    marginLeft: 5,
  },
  videoName: {
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
    lineHeight: 20,
  },
  commentCreatedAt: {
    position: 'absolute',
    top: 27,
    left: 155,
    fontSize: 12,
    color: '#BABABA',
  },
  commentContents: {
    fontWeight: 'bold',
    fontSize: 14,
    color: 'black',
    paddingVertical: 5,
    letterSpacing: 1,
  },
  modfiyCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentModifyInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '75%',
    paddingHorizontal: 15,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 1,
  },
});
