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

// Table columns for features, including date and hour
const featureColumns: { key: keyof AcousticFeatures; label: string }[] = [
  { key: 'filename', label: 'File' },
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Hour' },
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

/**
 * Helper to merge date/time from recordings into features if missing.
 * Gets: features (from context), recordings (from context)
 * Does: For each feature, finds the matching recording by filename and fills date/time if not present
 * Outputs: Array of AcousticFeatures with date/time populated
 */
function mergeFeatureDateTime(features: AcousticFeatures[], recordings: RecordingItem[]): AcousticFeatures[] {
  return features.map(feature => {
    if (feature.date && feature.time) return feature;
    const rec = recordings.find(r => r.path.split('/').pop() === feature.filename);
    return {
      ...feature,
      date: feature.date || rec?.date,
      time: feature.time || rec?.time,
    };
  });
}

/**
 * DeveloperScreen displays all recordings and a table of extracted acoustic features.
 * Gets: recordings and features from context
 * Does: Renders a FlatList for recordings and a table for features, merging date/time from recordings
 * Outputs: UI with playback and feature table
 */
const DeveloperScreen: React.FC = () => {
  const { recordings } = useRecordings();
  const { features } = useFeatures();
  const [playingPath, setPlayingPath] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playRef = useRef(audioRecorderPlayer);

  /**
   * Handles playback of a recording item.
   * Gets: RecordingItem from FlatList
   * Does: Starts/stops playback and manages state
   * Outputs: Updates playback state and UI
   */
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

  /**
   * Renders a single recording item in the FlatList.
   * Gets: RecordingItem
   * Does: Displays filename, length, date, time, and play button
   * Outputs: List.Item UI
   */
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

  /**
   * Renders a single row in the features table.
   * Gets: AcousticFeatures item
   * Does: Displays each feature value in a cell
   * Outputs: View row for the table
   */
  const renderFeatureRow = (item: AcousticFeatures) => (
    <View style={styles.row} key={item.filename}>
      {featureColumns.map(col => (
        <Text style={styles.cell} key={col.key.toString()} numberOfLines={1}>
          {item[col.key] !== undefined ? String(item[col.key]) : ''}
        </Text>
      ))}
    </View>
  );

  // Merge date/time from recordings into features for display
  const featuresWithDateTime = mergeFeatureDateTime(features, recordings);

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
          <FlatList
            data={featuresWithDateTime}
            keyExtractor={item => item.filename || Math.random().toString()}
            renderItem={({ item }) => (
              <View style={styles.row}>
                {featureColumns.map(col => (
                  <Text style={styles.cell} key={col.key.toString()} numberOfLines={1}>
                    {item[col.key] !== undefined ? String(item[col.key]) : ''}
                  </Text>
                ))}
              </View>
            )}
            style={{ maxHeight: 300 }}
          />
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