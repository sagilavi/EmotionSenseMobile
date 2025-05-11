import { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Button, SegmentedButtons, Text } from 'react-native-paper';

// Mock data for the chart
const mockData = {
  labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
  datasets: [
    {
      data: [5, 4, 7, 8, 6, 5],
      color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
      strokeWidth: 2,
    },
    {
      data: [3, 5, 4, 6, 7, 4],
      color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`,
      strokeWidth: 2,
    },
    {
      data: [6, 7, 5, 4, 5, 6],
      color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
      strokeWidth: 2,
    },
  ],
};

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
  },
};

export default function MindFlowPage() {
  const [timeRange, setTimeRange] = useState('day');
  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.header}>
        Your Emotional Flow
      </Text>

      <View style={styles.chartContainer}>
        <LineChart
          data={mockData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.controls}>
        <SegmentedButtons
          value={timeRange}
          onValueChange={setTimeRange}
          buttons={[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
          ]}
          style={styles.segmentedButtons}
        />

        <View style={styles.navigationButtons}>
          <Button mode="outlined" onPress={() => {}} style={styles.navButton}>
            Previous
          </Button>
          <Button mode="outlined" onPress={() => {}} style={styles.navButton}>
            Next
          </Button>
        </View>

        <Button
          mode="contained"
          onPress={() => {}}
          icon="whatsapp"
          style={styles.shareButton}
        >
          Share
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  controls: {
    gap: 16,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  navButton: {
    flex: 1,
  },
  shareButton: {
    marginTop: 8,
  },
}); 