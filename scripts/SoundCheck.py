import os
import pandas as pd
import numpy as np
from opensmile import Smile, FeatureSet, FeatureLevel
import librosa
import warnings
import pdb
from sklearn.preprocessing import MinMaxScaler

warnings.filterwarnings('ignore')

#Normalizes selected acoustic features (0–1 scale) using MinMaxScaler.

def normalize_acoustic_features(df, feature_columns):
    """
    Normalize selected acoustic features to a 0-1 range using MinMaxScaler.
    
    Args:
        df (pd.DataFrame): Raw acoustic features.
        feature_columns (list): List of feature column names.
    
    Returns:
        pd.DataFrame: Normalized acoustic features.
    """
    scaler = MinMaxScaler()

    normalized = scaler.fit_transform(df[feature_columns])
    df_normalized = df.copy()
    df_normalized[feature_columns] = normalized
    return df_normalized


#Scores each emotion (1–10) for each recording using rule-based text matching from your description table.
def map_emotions_by_keywords(normalized_df, emotion_df, feature_map):
    """
    Create a [recording x emotion] DataFrame with 1–10 scores based on keyword matching.
    
    Args:
        normalized_df (pd.DataFrame): Acoustic features (normalized).
        emotion_df (pd.DataFrame): Description of how features relate to emotions.
        feature_map (dict): Maps acoustic feature → emotion_df column.
        
    Returns:
        pd.DataFrame: Emotion scores per recording.
    """
    results = []
    emotion_df.columns = [col.strip() for col in emotion_df.columns]  # clean headers

    for idx, row in normalized_df.iterrows():
        emotion_scores = {}
        for _, emotion_row in emotion_df.iterrows():
            score = 0
            count = 0
            for feature, emotion_col in feature_map.items():
                description = str(emotion_row[emotion_col]).lower()
                value = row[feature]

                if 'high' in description:
                    score += value
                    count += 1
                elif 'low' in description:
                    score += 1 - value
                    count += 1
                elif 'moderate' in description or 'mid' in description:
                    score += 1 - abs(value - 0.5)
                    count += 1
                elif 'variable' in description or 'unstable' in description:
                    score += 0.5
                    count += 1

            final_score = round((score / count) * 10, 2) if count > 0 else 0
            emotion_scores[emotion_row['Emotion']] = final_score

        emotion_scores['filename'] = row['filename']
        results.append(emotion_scores)

    return pd.DataFrame(results).sort_values(by='filename')




def map_emotions_by_keywords_with_variance(normalized_df, emotion_df, feature_map, variance_df=None):
    """
    Create a [recording x emotion] DataFrame with 1–10 scores using normalized features and optional variance values.
    """
    results = []
    emotion_df.columns = [col.strip() for col in emotion_df.columns]

    # Define keyword mappings for different intensity levels
    intensity_keywords = {
        'high': ['high', 'raised', 'sharp', 'bright', 'spike', 'wide', 'fast', 'clear'],
        'low': ['low', 'lowered', 'dull', 'flat', 'narrow', 'slow'],
        'moderate': ['moderate', 'mid', 'balanced', 'moderately'],
        'variable': ['variable', 'unstable', 'shifting', 'irregular']
    }

    for idx, row in normalized_df.iterrows():
        emotion_scores = {}
        for _, emotion_row in emotion_df.iterrows():
            score = 0
            count = 0
            for feature, emotion_col in feature_map.items():
                description = str(emotion_row[emotion_col]).lower()
                value = row.get(feature, 0)
                
                # Skip if the value is NaN
                if pd.isna(value):
                    continue
                    
                # Skip if description is N/A
                if description.lower() == 'n/a':
                    continue

                # Check for any matching keywords in the description
                matched = False
                for intensity, keywords in intensity_keywords.items():
                    if any(keyword in description for keyword in keywords):
                        matched = True
                        if intensity == 'high':
                            score += value
                            count += 1
                        elif intensity == 'low':
                            score += 1 - value
                            count += 1
                        elif intensity == 'moderate':
                            score += 1 - abs(value - 0.5)
                            count += 1
                        elif intensity == 'variable':
                            if variance_df is not None and feature in variance_df.columns:
                                variance_val = variance_df.loc[idx][feature]
                                if not pd.isna(variance_val):
                                    score += min(variance_val, 1.0)
                                    count += 1
                            else:
                                score += 0.5
                                count += 1
                        break

                # If no keywords matched but we have a valid description, use a default moderate score
                if not matched and description.strip():
                    score += 0.5
                    count += 1

            # Calculate final score only if we have valid matches
            final_score = round((score / count) * 10, 2) if count > 0 else 0
            emotion_scores[emotion_row['Emotion']] = final_score

        emotion_scores['filename'] = row['filename']
        results.append(emotion_scores)

    result_df = pd.DataFrame(results).sort_values(by='filename')
    return result_df



#extract_selected_features for a fault-tolerant feature extraction
def extract_selected_features(df, selected_names):
    return {
        name: df.iloc[0][name] if name in df.columns else None
        for name in selected_names
    }


def analyze_voice_recording(audio_path):
    """
    Analyze a voice recording using OpenSMILE to extract 11 acoustic features.
    Returns a dictionary with feature values or None if file is invalid.
    """
    try:
        smile = Smile(
            feature_set=FeatureSet.eGeMAPSv02,
            feature_level=FeatureLevel.Functionals
        )

        features = smile.process_file(audio_path)

        selected = [
            'F0semitoneFrom27.5Hz_sma3nz_amean',# Pitch
            'HNRdBACF_sma3nz_amean',# Harmonics-to-noise
            'loudness_sma3_amean',# Loudness
            'F1frequency_sma3nz_amean',# Formant 1
             #'F2frequency_sma3nz_amean',# Formant 2
             #'F3frequency_sma3nz_amean',# Formant 3
            'jitterLocal_sma3nz_amean',# Jitter
            'shimmerLocaldB_sma3nz_amean',# Shimmer
            'mfcc1_sma3_amean',# MFCCs
            'spectralFlux_sma3_amean',# Spectral flux
            'pcm_zcr_sma3_amean',# Zero-Crossing Rate
            'F0semitoneFrom27.5Hz_sma3nz_stddevNorm',  #Pitch standard deviation → maps to "Pitch Variability"
            'localDuration_sma3_amean'  # → inverse of speech rate This isn't a direct measure of WPM (words per minute), but reflects temporal dynamics of voicing, often correlated with speech rate.

        ]

        return extract_selected_features(features, selected)

    except Exception as e:
        print(f"Error analyzing {audio_path}: {str(e)}")
        return None



def process_sound_samples(samples_dir):
    """
    Process all sound samples in the directory and create a pandas DataFrame.
    
    Args:
        samples_dir (str): Path to the directory containing sound samples
        
    Returns:
        pandas.DataFrame: DataFrame containing acoustic features for all samples
    """
    # List to store results
    results = []
    
    # Get all .ogg files in the directory
    sound_files = [f for f in os.listdir(samples_dir) if f.endswith('.ogg')]
    
    for sound_file in sound_files:
        file_path = os.path.join(samples_dir, sound_file)
        
        # Analyze the recording
        features = analyze_voice_recording(file_path)
        
        if features:
            # Add filename to features
            features['filename'] = sound_file
            results.append(features)
    
    # Create DataFrame
    if results:
        df = pd.DataFrame(results)
        # Reorder columns to put filename first
        cols = ['filename'] + [col for col in df.columns if col != 'filename']
        df = df[cols]
        return df
    else:
        return pd.DataFrame()



#feature_columns for normalization to use in normalize_acoustic_features
feature_columns = [
    'F0semitoneFrom27.5Hz_sma3nz_amean',
    'HNRdBACF_sma3nz_amean',
    'loudness_sma3_amean',
    'F1frequency_sma3nz_amean',
     #'F2frequency_sma3nz_amean',
     #'F3frequency_sma3nz_amean',
    'jitterLocal_sma3nz_amean',
    'shimmerLocaldB_sma3nz_amean',
    'mfcc1_sma3_amean',
    'spectralFlux_sma3_amean',
    'pcm_zcr_sma3_amean',
    'F0semitoneFrom27.5Hz_sma3nz_stddevNorm', 
    'localDuration_sma3_amean'  
]

feature_map = {
    'F0semitoneFrom27.5Hz_sma3nz_amean': 'Pitch',
    'HNRdBACF_sma3nz_amean': 'HNR',
    'loudness_sma3_amean': 'Loudness',
    'F1frequency_sma3nz_amean': 'Formant Changes',
     #'F2frequency_sma3nz_amean': 'Formant 2',
     #'F3frequency_sma3nz_amean': 'Formant 3',
    'jitterLocal_sma3nz_amean': 'Jitter',
    'shimmerLocaldB_sma3nz_amean': 'Shimmer',
    'mfcc1_sma3_amean': 'MFCCs',
    'spectralFlux_sma3_amean': 'Spectral Centroid',
    'pcm_zcr_sma3_amean': 'ZCR',
    'F0semitoneFrom27.5Hz_sma3nz_stddevNorm': 'Pitch Variability',
    'localDuration_sma3_amean': 'Speech Rate'
}


def main():
    """
    Main function to demonstrate usage

    """
    # Load emotion data
    Emotion_Acustic_df = pd.read_csv(r"C:\Users\sagil\OneDrive\Desktop\TheOak\Code\React\EmotionSense\Emotiondata\Full_Acoustic_Features_vs__All_Emotions.csv")
    print("Debug: Loaded emotion data shape:", Emotion_Acustic_df.shape)
    print("Debug: First row of emotion data:", Emotion_Acustic_df.iloc[0].to_dict())

    # Path to sound samples directory
    samples_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'SoundSamples')

    # Process all samples
    results_df = process_sound_samples(samples_dir)
    print("Debug: Processed sound samples shape:", results_df.shape)
    print("Debug: First row of sound samples:", results_df.iloc[0].to_dict())

    # Normalize the acoustic features
    normalized_df = normalize_acoustic_features(results_df, feature_columns)
    print("Debug: Normalized features shape:", normalized_df.shape)
    print("Debug: First row of normalized features:", normalized_df.iloc[0].to_dict())

    # Score the emotions
    emotion_scores = map_emotions_by_keywords_with_variance(normalized_df, Emotion_Acustic_df, feature_map)
    print("\nFinal emotion scores:")
    print(emotion_scores)
    pdb.set_trace()
    
    # Save results to CSV
    if not results_df.empty:
        output_path = os.path.join(os.path.dirname(__file__), 'acoustic_features.csv')
        results_df.to_csv(output_path, index=False)
        print(f"Results saved to {output_path}")
    else:
        print("No results were generated")

if __name__ == "__main__":
    main()
