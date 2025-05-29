import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Text, Title, List, Divider } from 'react-native-paper';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { useRecordings, RecordingItem } from '../context/RecordingsContext';

const audioRecorderPlayer = new AudioRecorderPlayer();

const playIcon = require('../../assets/playicon.png');
const pauseIcon = require('../../assets/pauseicon.png');

const DeveloperScreen: React.FC = () => {
  const { recordings } = useRecordings();
  const [playingPath, setPlayingPath] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playRef = useRef(audioRecorderPlayer);

  const handlePlay = async (item: RecordingItem) => {
    if (playingPath === item.path && isPlaying) {
      await playRef.current.stopPlayer();
      setIsPlaying(false);
      setPlayingPath(null);
      return;
    }
    await playRef.current.stopPlayer();
    await playRef.current.startPlayer(item.path);
    setPlayingPath(item.path);
    setIsPlaying(true);
    playRef.current.addPlayBackListener((e) => {
      if (e.currentPosition >= e.duration) {
        setIsPlaying(false);
        setPlayingPath(null);
        playRef.current.stopPlayer();
      }
      return;
    });
  };

  const renderItem = ({ item }: { item: RecordingItem }) => (
    <List.Item
      title={item.path.split('/').pop()}
      description={`Length: ${Math.round(item.length / 1000)}s | Date: ${item.date} | Time: ${item.time}`}
      right={props => (
        <TouchableOpacity onPress={() => handlePlay(item)}>
          <Image
            source={playingPath === item.path && isPlaying ? pauseIcon : playIcon}
            style={{ width: 32, height: 32, marginRight: 8 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
    />
  );

  return (
    <View style={styles.container}>
      <Title style={styles.header}>Developer: All Recordings</Title>
      <Divider style={{ marginBottom: 8 }} />
      <FlatList
        data={recordings}
        keyExtractor={item => item.path}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
};

export default DeveloperScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
}); 