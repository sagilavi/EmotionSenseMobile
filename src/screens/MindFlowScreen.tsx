import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Title, Button } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2,
  propsForDots: {
    r: '3',
    strokeWidth: '2',
    stroke: '#2196f3',
  },
};

const dummyData = {
  labels: ['8am', '10am', '12pm', '2pm', '4pm', '6pm'],
  datasets: [
    {
      data: [2, 4, 6, 5, 7, 3],
      color: () => '#2196f3',
      strokeWidth: 2,
    },
  ],
};

const MindFlowScreen: React.FC = () => {
  const [view, setView] = useState('Day');

  return (
    <View style={styles.container}>
      <Title style={styles.header}>Your Emotional Flow</Title>
      <View style={styles.toggleRow}>
        <Button mode={view === 'Day' ? 'contained' : 'outlined'} onPress={() => setView('Day')}>Day</Button>
        <Button mode={view === 'Week' ? 'contained' : 'outlined'} onPress={() => setView('Week')}>Week</Button>
        <Button mode={view === 'Month' ? 'contained' : 'outlined'} onPress={() => setView('Month')}>Month</Button>
      </View>
      {/* @ts-ignore: LineChart is a function component as per react-native-chart-kit docs */}
      <LineChart
        data={dummyData}
        width={Dimensions.get('window').width - 32}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
      <View style={styles.buttonRow}>
        <Button icon="chevron-left" mode="outlined" onPress={() => {}}>Prev</Button>
        <Button icon="share-variant" mode="outlined" onPress={() => {}}>Share</Button>
        <Button icon="chevron-right" mode="outlined" onPress={() => {}}>Next</Button>
      </View>
    </View>
  );
};

export default MindFlowScreen;

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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
}); 