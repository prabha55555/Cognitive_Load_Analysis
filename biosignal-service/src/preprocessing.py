"""
Dataset preprocessing module for Mendeley EEG cognitive load data.

Dataset Source: https://data.mendeley.com/datasets/kt38js3jv7/1
- 15 subjects (8M, 7F, avg. age 21)
- OpenBCI (8 channels, 250 Hz)
- Tasks: Arithmetic & Stroop (4 load levels each)
"""
import os
import pickle
import numpy as np
from scipy import signal
from typing import Dict, List, Tuple, Optional
from pathlib import Path

from .config import config


class DatasetPreprocessor:
    """Preprocessor for Mendeley cognitive load EEG dataset."""
    
    LOAD_LEVELS = ['natural', 'lowlevel', 'midlevel', 'highlevel']
    TASKS = ['Arithmetic_Data', 'Stroop_Data']
    NUM_SUBJECTS = 15
    
    def __init__(self, raw_data_path: Optional[str] = None, 
                 processed_data_path: Optional[str] = None):
        """Initialize preprocessor with data paths."""
        self.raw_data_path = Path(raw_data_path or config.RAW_DATA_PATH)
        self.processed_data_path = Path(processed_data_path or config.PROCESSED_DATA_PATH)
        self.processed_data_path.mkdir(parents=True, exist_ok=True)
    
    def load_eeg_file(self, filepath: str) -> Tuple[np.ndarray, str]:
        """
        Load single EEG recording from .txt file.
        
        File format from Mendeley dataset:
        - Each line is comma-separated with many fields
        - Column 0: sample index (0, 1, 2, ...)
        - Columns 1-8: EEG channels (8 channels)
        - Additional columns: accelerometer data, etc.
        - Last column: timestamp string (e.g., "2022-07-01 15:45:16.910")
        
        Args:
            filepath: Path to the EEG data file
            
        Returns:
            Tuple of (data array with 8 EEG channels, metadata string)
        """
        data = []
        metadata = ""
        
        with open(filepath, 'r') as f:
            for line_num, line in enumerate(f):
                line = line.strip()
                if not line:
                    continue
                    
                # Split by comma
                parts = [p.strip() for p in line.split(',')]
                
                # We need at least 9 values (index + 8 channels)
                if len(parts) < 9:
                    continue
                
                try:
                    # Extract EEG channels (columns 1-8, skip index at column 0)
                    # These should be the 8 OpenBCI channels
                    eeg_values = []
                    for i in range(1, 9):  # columns 1 through 8
                        val = parts[i].strip()
                        eeg_values.append(float(val))
                    
                    data.append(eeg_values)
                    
                    # Use first line as metadata reference
                    if line_num == 0:
                        metadata = f"Samples starting at: {parts[-1] if parts[-1] else 'unknown'}"
                        
                except (ValueError, IndexError) as e:
                    # Skip lines that can't be parsed (likely header or corrupt)
                    if line_num == 0:
                        metadata = line  # First line might be header
                    continue
        
        if not data:
            raise ValueError(f"No valid EEG data found in {filepath}")
        
        return np.array(data), metadata
    
    def extract_frequency_bands(self, eeg_signal: np.ndarray, 
                                fs: int = 250) -> Dict[str, np.ndarray]:
        """
        Extract theta, alpha, beta, gamma frequency bands from EEG signal.
        
        Args:
            eeg_signal: Raw EEG signal array
            fs: Sampling frequency (250 Hz for this dataset)
            
        Returns:
            Dictionary with band names as keys and power arrays as values
        """
        bands = {
            'theta': (4, 8),
            'alpha': (8, 13),
            'beta': (13, 30),
            'gamma': (30, 50)
        }
        
        band_powers = {}
        
        for band_name, (low_freq, high_freq) in bands.items():
            # Design bandpass filter
            sos = signal.butter(
                4, 
                [low_freq, high_freq], 
                btype='band', 
                fs=fs, 
                output='sos'
            )
            # Apply filter
            filtered = signal.sosfilt(sos, eeg_signal, axis=0)
            # Calculate power
            band_powers[band_name] = np.mean(filtered ** 2, axis=0)
        
        return band_powers
    
    def analyze_cognitive_load_patterns(self) -> Dict[str, Dict]:
        """
        Analyze EEG patterns for each cognitive load level across all subjects.
        
        Returns:
            Nested dictionary with task -> level -> statistics
        """
        analysis_results = {}
        
        for task in self.TASKS:
            analysis_results[task] = {}
            
            for level in self.LOAD_LEVELS:
                level_data = []
                
                # Load all subjects for this level
                for subject_id in range(1, self.NUM_SUBJECTS + 1):
                    filepath = self.raw_data_path / task / f'{level}-{subject_id}.txt'
                    
                    if filepath.exists():
                        try:
                            data, metadata = self.load_eeg_file(str(filepath))
                            level_data.append(data)
                        except Exception as e:
                            print(f"Error loading {filepath}: {e}")
                
                if level_data:
                    # Concatenate all subjects' data
                    # Handle different lengths by using minimum
                    min_length = min(d.shape[0] for d in level_data)
                    truncated_data = [d[:min_length] for d in level_data]
                    all_data = np.stack(truncated_data, axis=0)
                    
                    analysis_results[task][level] = {
                        'mean': np.mean(all_data, axis=(0, 1)),  # Mean across subjects and time
                        'std': np.std(all_data, axis=(0, 1)),
                        'shape': all_data.shape,
                        'sample': all_data[0, :250],  # First second from first subject
                        'all_samples': all_data[:, :250]  # First second from all subjects
                    }
                else:
                    print(f"No data found for {task}/{level}")
        
        return analysis_results
    
    def create_reference_patterns(self) -> Dict[str, Dict]:
        """
        Create averaged reference patterns for each cognitive load level.
        
        Returns:
            Reference pattern database for use with Chronos
        """
        # First analyze the dataset
        print("Analyzing dataset patterns...")
        analysis = self.analyze_cognitive_load_patterns()
        
        reference_db = {}
        
        for task in self.TASKS:
            if task not in analysis:
                continue
                
            reference_db[task] = {}
            
            for level in self.LOAD_LEVELS:
                if level not in analysis[task]:
                    continue
                    
                sample_data = analysis[task][level]['sample']
                
                # Extract frequency bands
                bands = self.extract_frequency_bands(sample_data)
                
                # Store reference pattern
                reference_db[task][level] = {
                    'raw_signal': sample_data,
                    'frequency_bands': bands,
                    'mean': analysis[task][level]['mean'],
                    'std': analysis[task][level]['std'],
                    'all_samples': analysis[task][level].get('all_samples')
                }
        
        return reference_db
    
    def save_reference_patterns(self, reference_db: Dict) -> str:
        """
        Save reference patterns to disk.
        
        Args:
            reference_db: Reference pattern database
            
        Returns:
            Path to saved file
        """
        output_path = self.processed_data_path / 'reference_patterns.pkl'
        
        with open(output_path, 'wb') as f:
            pickle.dump(reference_db, f)
        
        print(f"Saved reference patterns to {output_path}")
        return str(output_path)
    
    def load_reference_patterns(self) -> Optional[Dict]:
        """
        Load reference patterns from disk.
        
        Returns:
            Reference pattern database or None if not found
        """
        pattern_path = self.processed_data_path / 'reference_patterns.pkl'
        
        if not pattern_path.exists():
            return None
        
        with open(pattern_path, 'rb') as f:
            return pickle.load(f)
    
    def create_synthetic_reference_patterns(self) -> Dict[str, Dict]:
        """
        Create synthetic reference patterns based on research literature.
        Used when the actual Mendeley dataset is not available.
        
        This generates realistic EEG-like patterns for each cognitive load level
        based on known characteristics from neuroscience research.
        """
        print("Creating synthetic reference patterns (dataset not available)...")
        
        np.random.seed(42)  # Reproducibility
        reference_db = {}
        
        # Base parameters from research
        # Higher cognitive load: increased theta/beta, decreased alpha
        load_params = {
            'natural': {'theta_base': 12, 'alpha_base': 45, 'beta_base': 15, 'noise': 0.1},
            'lowlevel': {'theta_base': 18, 'alpha_base': 38, 'beta_base': 22, 'noise': 0.15},
            'midlevel': {'theta_base': 25, 'alpha_base': 30, 'beta_base': 32, 'noise': 0.2},
            'highlevel': {'theta_base': 35, 'alpha_base': 20, 'beta_base': 45, 'noise': 0.25}
        }
        
        for task in self.TASKS:
            reference_db[task] = {}
            
            for level in self.LOAD_LEVELS:
                params = load_params[level]
                
                # Generate 1 second of synthetic EEG at 250 Hz
                t = np.linspace(0, 1, 250)
                num_channels = config.NUM_CHANNELS
                
                # Generate multi-channel EEG signal
                raw_signal = np.zeros((250, num_channels))
                
                for ch in range(num_channels):
                    # Compose signal from different frequency bands
                    theta = params['theta_base'] * np.sin(2 * np.pi * 6 * t + np.random.random() * np.pi)
                    alpha = params['alpha_base'] * np.sin(2 * np.pi * 10 * t + np.random.random() * np.pi)
                    beta = params['beta_base'] * np.sin(2 * np.pi * 20 * t + np.random.random() * np.pi)
                    
                    # Add noise
                    noise = np.random.randn(250) * params['noise'] * 20
                    
                    # Combine
                    raw_signal[:, ch] = (theta + alpha + beta + noise) / 3
                
                # Calculate frequency bands
                bands = self.extract_frequency_bands(raw_signal)
                
                reference_db[task][level] = {
                    'raw_signal': raw_signal,
                    'frequency_bands': bands,
                    'mean': np.mean(raw_signal, axis=0),
                    'std': np.std(raw_signal, axis=0),
                    'synthetic': True
                }
        
        return reference_db
    
    def preprocess(self, use_synthetic_if_missing: bool = True) -> Dict:
        """
        Main preprocessing pipeline.
        
        Args:
            use_synthetic_if_missing: Create synthetic patterns if dataset not found
            
        Returns:
            Reference pattern database
        """
        # Try to load existing patterns
        existing = self.load_reference_patterns()
        if existing:
            print("Loaded existing reference patterns")
            return existing
        
        # Check if raw data exists
        arithmetic_path = self.raw_data_path / 'Arithmetic_Data'
        
        if arithmetic_path.exists() and any(arithmetic_path.iterdir()):
            # Process actual dataset
            reference_db = self.create_reference_patterns()
        elif use_synthetic_if_missing:
            # Create synthetic patterns
            reference_db = self.create_synthetic_reference_patterns()
        else:
            raise FileNotFoundError(
                f"Dataset not found at {self.raw_data_path}. "
                "Download from https://data.mendeley.com/datasets/kt38js3jv7/1"
            )
        
        # Save patterns
        self.save_reference_patterns(reference_db)
        
        return reference_db


# Singleton instance
_preprocessor: Optional[DatasetPreprocessor] = None


def get_preprocessor() -> DatasetPreprocessor:
    """Get or create singleton preprocessor instance."""
    global _preprocessor
    if _preprocessor is None:
        _preprocessor = DatasetPreprocessor()
    return _preprocessor
