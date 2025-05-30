import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Title, List, Divider } from 'react-native-paper';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { useRecordings, RecordingItem } from '../context/RecordingsContext';
import { useFeatures } from '../context/RecordingsContext';
import { AcousticFeatures } from '../AcousticFeatures';

const audioRecorderPlayer = new AudioRecorderPlayer();

const playIcon = require('../../assets/playicon.png');
const pauseIcon = require('../../assets/pauseicon.png');

const featureColumns: { key: keyof AcousticFeatures; label: string }[] = [
  { key: 'filename', label: 'File' },
  { key: 'pitch', label: 'Pitch' },
  { key: 'hnr', label: 'HNR' },
  { key: 'loudness', label: 'Loudness' },
  { key: 'formant1', label: 'Formant 1' },
  { key: 'jitter', label: 'Jitter' },
  { key: 'shimmer', label: 'Shimmer' },
  { key: 'mfcc1', label: 'MFCC1' },
  { key: 'spectralFlux', label: 'Spectral Flux' },
  { key: 'zcr', label: 'ZCR' },
  { key: 'pitchVariability', label: 'Pitch Var.' },
  { key: 'speechRate', label: 'Speech Rate' },
];

const DeveloperScreen: React.FC = () => {
  const { recordings } = useRecordings();
  const { features } = useFeatures();
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

  const renderFeatureRow = (item: AcousticFeatures) => (
    <View style={styles.row} key={item.filename}>
      {featureColumns.map(col => (
        <Text style={styles.cell} key={col.key.toString()} numberOfLines={1}>
          {item[col.key] !== undefined ? String(item[col.key]) : ''}
        </Text>
      ))}
    </View>
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
      <Divider style={{ marginVertical: 16 }} />
      <Title style={styles.header}>Acoustic Features Table</Title>
      <ScrollView horizontal>
        <View>
          <View style={styles.row}>
            {featureColumns.map(col => (
              <Text style={[styles.cell, styles.headerCell]} key={col.key.toString()}>{col.label}</Text>
            ))}
          </View>
          {features.map(renderFeatureRow)}
        </View>
      </ScrollView>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#eee',
    minHeight: 32,
  },
  cell: {
    minWidth: 80,
    paddingHorizontal: 4,
    fontSize: 12,
    textAlign: 'center',
  },
  headerCell: {
    fontWeight: 'bold',
    backgroundColor: '#f5f5f5',
  },
}); 