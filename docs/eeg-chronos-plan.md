# Cognitive Load Analysis Platform – Synthetic EEG Generation Plan (Chronos + Mendeley Dataset)

---

## 1. System Architecture Overview

### Objective
Generate realistic EEG and brainwave visualizations in your app without collecting real-time biosignals, using Amazon Chronos and the cognitive load Mendeley dataset.

### High-level Diagram
```
User → Application (Frontend) → Metrics & Phase Data
     ↓                                     ↑
Biosignal Service (Backend) ← Chronos Model
     ↑             ↑
Cognitive Load  Seed Patterns
 Mapping      (from Dataset)
```
---

## 2. Dataset Details
- **Source**: https://data.mendeley.com/datasets/kt38js3jv7/1
- **Subjects**: 15 (8M, 7F, avg. age 21)
- **Device/Setup**: OpenBCI (8 channels, 250 Hz)
- **Tasks**: Arithmetic & Stroop (each – 4 load levels: Natural, Low, Mid, High)
- **Files**: `/Arithmetic_Data/`, `/Stroop_Data/` (plain text, 1-2 min per session)
- **Usage**: Extract EEG patterns for all cognitive load levels as reference templates.

---

## 3. Implementation Timeline (Weeks 1-5)

### **Week 1: Dataset Preparation & Analysis**
- Download, organize, and preprocess all EEG files
- For each load level, average/extract relevant EEG segments (per channel)
- Store reference arrays (e.g., 50-point timeline samples from session summaries)

### **Week 2: Chronos Foundation Model Integration**
- Setup Python env (`transformers`, `torch`, `chronos` via HuggingFace)
- Load Chronos pretrained model
- Test: Input reference EEG vector, generate zero-shot forecasts/variations

```python
# Sample Python for Chronos
test_sample = np.loadtxt('lowlevel-1.txt')[:1000]  # Load data, preprocess
from chronos import ChronosPipeline
pipeline = ChronosPipeline.from_pretrained('amazon/chronos-t5-large')
forecast = pipeline.predict(context=test_sample, prediction_length=50)
```

### **Week 3: Backend API Development**
- Flask (Python) microservice: exposes `/generate_eeg` endpoint
- Accepts: cognitive load input (0-100), load level, template type
- Returns: timeline, brainwave arrays
- Optionally: randomizes slight variations (for realism)

### **Week 4: Frontend Integration**
- Fetch EEG/brainwave patterns for given participant phase
- Render line/multiline charts (as in your UI spec)
- Simulate live EEG progression, color-coded load state

### **Week 5: Validation & Tuning**
- Visually validate signal realism (compare against dataset)
- Tune Chronos sampling parameters (temperature, window length) for best output
- Unit and integration tests from backend to chart rendering

---

## 4. Mapping Metrics to EEG Generation

- Map app metrics (interactionCount, assessmentTime, accuracy, clarifications) to discrete cognitive load categories (Low/Mod/High/Very High)
- Use these as keys to select the corresponding EEG templates → pass as context to Chronos
- Generate and smooth new timelines for results

---

## 5. Example Python Code Snippets

```python
def map_load_to_template(metrics):
    # Map score to load level
    score = metrics['cognitiveLoadScore']
    if score < 30:
        return 'natural'
    elif score < 50:
        return 'lowlevel'
    elif score < 70:
        return 'midlevel'
    else:
        return 'highlevel'

def generate_eeg_snippet(template_file):
    eeg = np.loadtxt(template_file)
    # Downsample for plotting
    timeline = eeg[:50]
    return timeline

# Zero-shot EEG
from chronos import ChronosPipeline
pipe = ChronosPipeline.from_pretrained('amazon/chronos-t5-large')
context = generate_eeg_snippet('midlevel-7.txt')
pred = pipe.predict(context=context, prediction_length=50)
```

---

## 6. Validation Strategy
- Compare generated signals statistically and visually with original dataset
- Validate band power (theta/alpha/beta) ratios, signal ranges
- Pilot app with mock participants: check for realism/responsiveness

---

## 7. Risks & Mitigation
- *Risk*: Synthetic signals deviate from real EEG → *Mitigation*: Anchor Chronos to real dataset samples per load level
- *Risk*: Signal artifacts or outliers → Clamp output, add denoising step

---

## 8. Success Metrics
- Visual indistinguishability from real for domain experts (overlay plots)
- User acceptance in pilot sessions
- Smooth integration (real-time API → frontend chart)

---

## 9. References
- [Chronos Model Paper](https://arxiv.org/abs/2403.07815)
- [Mendeley Dataset](https://data.mendeley.com/datasets/kt38js3jv7/1)
- [EEG-Augmentation Review](https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2023.1219133/full)


Synthetic EEG Generation Implementation Plan
Cognitive Load Analysis Platform - Biosignal Integration
Project: Cognitive Load Comparison Study (ChatGPT vs Google Search)
Date: November 29, 2025
Foundation Model: Amazon Chronos
Dataset: Cognitive Load Assessment Through EEG (Mendeley)[1]
________________________________________
Executive Summary
This document outlines the implementation strategy for integrating synthetic EEG/EDA biosignal generation into the Cognitive Load Analysis Platform without requiring real-time hardware. We will use the Amazon Chronos time series foundation model with the publicly available cognitive load EEG dataset to generate realistic biosignal visualizations based on participant performance metrics.
________________________________________
Table of Contents
1.	Architecture Overview
2.	Dataset Analysis
3.	Implementation Phases
4.	Technical Stack
5.	API Design
6.	Frontend Integration
7.	Validation Strategy
8.	Timeline & Milestones
________________________________________
Architecture Overview
System Flow
┌─────────────────────────────────────────────────────────────┐
│ Frontend Application │
│ (Research Phase → Assessment → Results → Creativity Test) │
└──────────────────────┬──────────────────────────────────────┘
│
│ Participant Metrics
│ (interactions, time, accuracy, etc.)
▼
┌─────────────────────────────────────────────────────────────┐
│ Biosignal Service │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Metric → Cognitive Load Mapper │ │
│ └────────────────┬───────────────────────────────────┘ │
│ │ │
│ ┌────────────────▼───────────────────────────────────┐ │
│ │ EEG Pattern Database (from Mendeley dataset) │ │
│ │ - Natural/Low/Mid/High load reference patterns │ │
│ └────────────────┬───────────────────────────────────┘ │
│ │ │
│ ┌────────────────▼───────────────────────────────────┐ │
│ │ Chronos Foundation Model │ │
│ │ - Zero-shot time series forecasting │ │
│ │ - Pattern extension & variation generation │ │
│ └────────────────┬───────────────────────────────────┘ │
│ │ │
│ ┌────────────────▼───────────────────────────────────┐ │
│ │ Signal Processing Pipeline │ │
│ │ - Frequency band decomposition (θ, α, β) │ │
│ │ - Timeline aggregation (50 points) │ │
│ │ - Normalization & smoothing │ │
│ └────────────────┬───────────────────────────────────┘ │
└───────────────────┼──────────────────────────────────────────┘
│
│ Generated Biosignal Data
▼
┌─────────────────────────────────────────────────────────────┐
│ Visualization Component │
│ - Cognitive Load Timeline (line chart) │
│ - Brain Wave Patterns (multi-line chart) │
└─────────────────────────────────────────────────────────────┘
________________________________________
Dataset Analysis
Dataset Overview
Source: Mendeley Data - Cognitive Load Assessment Through EEG[1]
DOI: 10.17632/kt38js3jv7.1
URL: https://data.mendeley.com/datasets/kt38js3jv7/1
Dataset Specifications
Property	Value
Participants	15 subjects (8 male, 7 female)
Average Age	21 years
Device	OpenBCI EEG Electrode Cap (Cyton board)
Channels	8 channels: Fp1, Fp2, F7, F3, FZ, F4, F8, C2
Sampling Rate	250 Hz
Session Duration	1-2 minutes per session
Tasks	Arithmetic and Stroop tests

Cognitive Load Levels
The dataset contains four cognitive load levels that directly map to our application:
Level	Description	Duration	Mapping to Our App
Natural	Baseline brain activity	N/A	Low cognitive load (score: 0-30)
Low-Level	Simple tasks, 10s time limit	10s	Moderate cognitive load (score: 31-50)
Mid-Level	Standard complexity, 10-20s limit	10-20s	High cognitive load (score: 51-70)
High-Level	Complex tasks, 20s limit	20s	Very high cognitive load (score: 71-100)

Directory Structure
/raw_data/
├── /Arithmetic_Data/
│ ├── natural-1.txt to natural-15.txt
│ ├── lowlevel-1.txt to lowlevel-15.txt
│ ├── midlevel-1.txt to midlevel-15.txt
│ └── highlevel-1.txt to highlevel-15.txt
└── /Stroop_Data/
├── natural-1.txt to natural-15.txt
├── lowlevel-1.txt to lowlevel-15.txt
├── midlevel-1.txt to midlevel-15.txt
└── highlevel-1.txt to highlevel-15.txt
Data Format
•	File Format: Plain text (.txt)
•	First Line: Metadata (subject ID, condition)
•	Subsequent Lines: EEG signal values at 250 Hz sampling rate
•	Channels: 8 values per timestamp (one per electrode)
________________________________________
Implementation Phases
Phase 1: Dataset Preparation & Analysis (Week 1)
Objectives
•	Download and organize Mendeley dataset
•	Analyze EEG patterns for each cognitive load level
•	Extract representative patterns for each level
•	Validate data quality
Tasks
1.1 Data Acquisition
Download dataset from Mendeley
wget https://data.mendeley.com/public-files/datasets/kt38js3jv7/files/[dataset-id]/file_downloaded.zip
Extract and organize
unzip file_downloaded.zip -d ./eeg_dataset
1.2 Data Analysis Script
scripts/analyze_dataset.py
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy import signal
import os
def load_eeg_file(filepath):
"""Load single EEG recording from .txt file"""
with open(filepath, 'r') as f:
# First line is metadata
metadata = f.readline().strip()
# Rest is signal data
data = []
for line in f:
values = [float(x) for x in line.strip().split()]
data.append(values)
return np.array(data), metadata
def analyze_cognitive_load_patterns(data_dir):
"""Analyze patterns for each cognitive load level"""
levels = ['natural', 'lowlevel', 'midlevel', 'highlevel']
tasks = ['Arithmetic_Data', 'Stroop_Data']

analysis_results = {}

for task in tasks:
    analysis_results[task] = {}
    for level in levels:
        level_data = []
        
        # Load all subjects for this level
        for subject_id in range(1, 16):
            filepath = os.path.join(
                data_dir, 
                task, 
                f'{level}-{subject_id}.txt'
            )
            if os.path.exists(filepath):
                data, metadata = load_eeg_file(filepath)
                level_data.append(data)
        
        # Calculate statistics
        all_data = np.concatenate(level_data, axis=0)
        analysis_results[task][level] = {
            'mean': np.mean(all_data, axis=0),
            'std': np.std(all_data, axis=0),
            'shape': all_data.shape,
            'sample': all_data[:250]  # First second
        }

return analysis_results

def extract_frequency_bands(eeg_signal, fs=250):
"""Extract theta, alpha, beta, gamma bands"""
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

Run analysis
if name == "main":
results = analyze_cognitive_load_patterns('./eeg_dataset/raw_data')
# Save analysis results
import pickle
with open('./processed_data/analysis_results.pkl', 'wb') as f:
    pickle.dump(results, f)

print("Dataset analysis complete!")

1.3 Create Reference Pattern Database
scripts/create_pattern_database.py
import numpy as np
import pickle
from analyze_dataset import extract_frequency_bands
def create_reference_patterns():
"""Create averaged reference patterns for each load level"""
with open('./processed_data/analysis_results.pkl', 'rb') as f:
    analysis = pickle.load(f)

reference_db = {}

for task in ['Arithmetic_Data', 'Stroop_Data']:
    reference_db[task] = {}
    
    for level in ['natural', 'lowlevel', 'midlevel', 'highlevel']:
        sample_data = analysis[task][level]['sample']
        
        # Extract frequency bands
        bands = extract_frequency_bands(sample_data)
        
        # Store reference pattern
        reference_db[task][level] = {
            'raw_signal': sample_data,
            'frequency_bands': bands,
            'mean': analysis[task][level]['mean'],
            'std': analysis[task][level]['std']
        }

# Save reference database
with open('./processed_data/reference_patterns.pkl', 'wb') as f:
    pickle.dump(reference_db, f)

return reference_db

if name == "main":
db = create_reference_patterns()
print(f"Created reference patterns for {len(db)} tasks")
Deliverables
•	[ ] Dataset downloaded and organized
•	[ ] Analysis scripts completed
•	[ ] Reference pattern database created
•	[ ] Documentation of EEG characteristics per load level
________________________________________
Phase 2: Chronos Model Integration (Week 2)
Objectives
•	Set up Chronos foundation model
•	Create time series generation pipeline
•	Test zero-shot forecasting capabilities
•	Validate generated signals against real patterns
Tasks
2.1 Environment Setup
Create virtual environment
python -m venv chronos_env
source chronos_env/bin/activate
Install dependencies
pip install torch transformers chronos-forecasting
pip install numpy scipy matplotlib pandas
2.2 Chronos Integration Service
services/chronosService.py
import torch
from chronos import ChronosPipeline
import numpy as np
import pickle
class ChronosEEGGenerator:
def init(self, model_name="amazon/chronos-t5-large"):
"""Initialize Chronos model"""
self.pipeline = ChronosPipeline.from_pretrained(
model_name,
device_map="cpu", # Use "cuda" if GPU available
torch_dtype=torch.bfloat16
)
    # Load reference patterns
    with open('./processed_data/reference_patterns.pkl', 'rb') as f:
        self.reference_patterns = pickle.load(f)

def select_seed_pattern(self, cognitive_load_score):
    """Select appropriate seed pattern based on cognitive load"""
    
    # Map score to dataset level
    if cognitive_load_score < 30:
        level = 'natural'
    elif cognitive_load_score < 50:
        level = 'lowlevel'
    elif cognitive_load_score < 70:
        level = 'midlevel'
    else:
        level = 'highlevel'
    
    # Use Arithmetic task patterns (more relevant to our study)
    pattern = self.reference_patterns['Arithmetic_Data'][level]
    
    return pattern['raw_signal'], level

def generate_session_timeline(
    self, 
    cognitive_load_score, 
    duration_minutes=15,
    channel_idx=3  # F3 channel (frontal cortex)
):
    """Generate 15-minute EEG timeline using Chronos"""
    
    # Get seed pattern
    seed_pattern, level = self.select_seed_pattern(cognitive_load_score)
    
    # Use single channel for cognitive load representation
    seed_signal = seed_pattern[:, channel_idx]
    
    # Calculate number of segments (250 Hz * 60 sec * 15 min = 225,000 samples)
    # Generate in chunks due to memory constraints
    segment_length = 250 * 60  # 1 minute segments
    num_segments = duration_minutes
    
    full_timeline = []
    
    for segment in range(num_segments):
        # Add temporal variation (cognitive load changes over time)
        load_variation = self._calculate_temporal_variation(
            segment, 
            duration_minutes, 
            cognitive_load_score
        )
        
        # Adjust seed pattern based on variation
        adjusted_seed = seed_signal * (1 + load_variation / 100)
        
        # Use last 250 samples as context (1 second)
        context = adjusted_seed[-250:] if segment == 0 else full_timeline[-250:]
        context_tensor = torch.tensor(context).float().unsqueeze(0)
        
        # Generate next segment
        forecast = self.pipeline.predict(
            context=context_tensor,
            prediction_length=segment_length,
            num_samples=1
        )
        
        generated_segment = forecast[0].numpy().flatten()
        full_timeline.extend(generated_segment)
    
    return np.array(full_timeline), level

def _calculate_temporal_variation(self, current_minute, total_minutes, base_load):
    """Calculate how cognitive load varies over time"""
    
    # Early phase: Adaptation (slightly lower)
    # Middle phase: Peak engagement (baseline)
    # Late phase: Fatigue (slightly higher)
    
    progress = current_minute / total_minutes
    
    if progress < 0.2:  # First 3 minutes
        return -5  # Adaptation phase
    elif progress > 0.8:  # Last 3 minutes
        return 8  # Fatigue phase
    else:
        return np.random.uniform(-3, 3)  # Natural variation

def generate_aggregated_timeline(self, cognitive_load_score, num_points=50):
    """Generate 50-point timeline for visualization"""
    
    # Generate full timeline
    full_timeline, level = self.generate_session_timeline(
        cognitive_load_score
    )
    
    # Aggregate to 50 points
    segment_size = len(full_timeline) // num_points
    aggregated = []
    
    for i in range(num_points):
        start_idx = i * segment_size
        end_idx = start_idx + segment_size
        segment = full_timeline[start_idx:end_idx]
        
        # Use RMS (root mean square) as representative value
        rms_value = np.sqrt(np.mean(segment ** 2))
        aggregated.append(rms_value)
    
    # Normalize to 0-100 range for cognitive load display
    normalized = self._normalize_to_load_range(
        np.array(aggregated), 
        cognitive_load_score
    )
    
    return normalized, level

def _normalize_to_load_range(self, signal, target_load):
    """Normalize signal to center around target cognitive load"""
    
    # Standardize
    signal_std = (signal - signal.mean()) / signal.std()
    
    # Scale to ±15 range around target
    signal_scaled = signal_std * 10 + target_load
    
    # Clip to valid range
    signal_clipped = np.clip(signal_scaled, 0, 100)
    
    return signal_clipped

def generate_brainwave_patterns(self, cognitive_load_score, num_points=50):
    """Generate frequency band patterns (theta, alpha, beta)"""
    
    from scipy import signal as scipy_signal
    
    # Get seed pattern
    seed_pattern, level = self.select_seed_pattern(cognitive_load_score)
    
    # Use F3 channel (frontal cortex)
    eeg_signal = seed_pattern[:, 3]
    
    # Extract frequency bands
    fs = 250  # Sampling rate
    
    bands = {
        'theta': (4, 8),
        'alpha': (8, 13),
        'beta': (13, 30)
    }
    
    band_patterns = {}
    
    for band_name, (low_freq, high_freq) in bands.items():
        # Design bandpass filter
        sos = scipy_signal.butter(
            4, 
            [low_freq, high_freq], 
            btype='band', 
            fs=fs, 
            output='sos'
        )
        
        # Apply filter
        filtered = scipy_signal.sosfilt(sos, eeg_signal)
        
        # Calculate power over time windows
        window_size = len(filtered) // num_points
        power_timeline = []
        
        for i in range(num_points):
            start = i * window_size
            end = start + window_size
            window_data = filtered[start:end]
            power = np.mean(window_data ** 2)
            power_timeline.append(power)
        
        # Normalize and scale for visualization
        power_array = np.array(power_timeline)
        normalized = (power_array - power_array.min()) / (power_array.max() - power_array.min())
        
        # Scale to appropriate range based on band and load level
        scaled = self._scale_band_for_load(normalized, band_name, cognitive_load_score)
        
        band_patterns[band_name] = scaled
    
    return band_patterns

def _scale_band_for_load(self, normalized_signal, band_name, cognitive_load):
    """Scale frequency band based on cognitive load research"""
    
    # Research findings:
    # - High cognitive load → increased theta & beta, decreased alpha
    # - Low cognitive load → decreased theta & beta, increased alpha
    
    load_factor = cognitive_load / 100  # 0 to 1
    
    if band_name == 'theta':
        # Theta increases with load (range: 30-70 Hz)
        base = 30 + 20 * load_factor
        amplitude = 15
    elif band_name == 'alpha':
        # Alpha decreases with load (range: 60-35 Hz)
        base = 60 - 25 * load_factor
        amplitude = 12
    elif band_name == 'beta':
        # Beta increases with load (range: 25-55 Hz)
        base = 25 + 30 * load_factor
        amplitude = 10
    
    scaled = base + amplitude * normalized_signal
    
    return scaled

Initialize global generator
generator = ChronosEEGGenerator()
2.3 Testing Script
tests/test_chronos_generation.py
import matplotlib.pyplot as plt
from chronosService import generator
def test_generation_quality():
"""Test biosignal generation for different load levels"""
load_levels = [20, 45, 65, 85]  # Low, Moderate, High, Very High

fig, axes = plt.subplots(4, 2, figsize=(15, 12))

for idx, load in enumerate(load_levels):
    # Generate timeline
    timeline, level = generator.generate_aggregated_timeline(load)
    
    # Generate brainwaves
    brainwaves = generator.generate_brainwave_patterns(load)
    
    # Plot timeline
    axes[idx, 0].plot(timeline)
    axes[idx, 0].set_title(f'Cognitive Load Timeline (Score: {load}, Level: {level})')
    axes[idx, 0].set_ylabel('Cognitive Load')
    axes[idx, 0].set_ylim([0, 100])
    
    # Plot brainwaves
    axes[idx, 1].plot(brainwaves['theta'], label='Theta (4-8 Hz)', color='blue')
    axes[idx, 1].plot(brainwaves['alpha'], label='Alpha (8-13 Hz)', color='green')
    axes[idx, 1].plot(brainwaves['beta'], label='Beta (13-30 Hz)', color='red')
    axes[idx, 1].set_title(f'Brainwave Patterns (Score: {load})')
    axes[idx, 1].set_ylabel('Power (Hz)')
    axes[idx, 1].legend()

plt.tight_layout()
plt.savefig('./tests/generation_quality.png', dpi=300)
print("Test complete! Check ./tests/generation_quality.png")

if name == "main":
test_generation_quality()
Deliverables
•	[ ] Chronos model integrated and tested
•	[ ] EEG generation pipeline functional
•	[ ] Validation results documented
•	[ ] Performance benchmarks recorded
________________________________________
Phase 3: Backend API Development (Week 3)
Objectives
•	Create RESTful API for biosignal generation
•	Integrate with existing participant tracking
•	Implement caching for performance
•	Add error handling and logging
Tasks
3.1 API Service Architecture
// backend/services/biosignalService.ts
interface ParticipantMetrics {
interactionCount: number;
clarificationRequests: number;
assessmentTime: number;
assessmentAccuracy: number;
timeSpent: number;
}
interface BiosignalData {
cognitiveLoadTimeline: number[];
brainwavePatterns: {
theta: number[];
alpha: number[];
beta: number[];
};
metadata: {
cognitiveLoadScore: number;
loadLevel: string;
platform: 'chatgpt' | 'google';
generatedAt: Date;
};
}
class BiosignalService {
private pythonProcess: any;
private cache: Map<string, BiosignalData>;
constructor() {
this.cache = new Map();
this.initializePythonBridge();
}
private initializePythonBridge() {
// Initialize Python child process for Chronos model
const { spawn } = require('child_process');
this.pythonProcess = spawn('python', [
  './services/python/biosignal_server.py'
]);

this.pythonProcess.stdout.on('data', (data: Buffer) => {
  console.log(`Python service: ${data.toString()}`);
});

}
async generateBiosignals(
participantId: string,
metrics: ParticipantMetrics,
platform: 'chatgpt' | 'google'
): Promise<BiosignalData> {
// Check cache first
const cacheKey = this.getCacheKey(participantId, metrics);
if (this.cache.has(cacheKey)) {
  console.log(`Cache hit for participant ${participantId}`);
  return this.cache.get(cacheKey)!;
}

// Calculate cognitive load score
const cognitiveLoadScore = this.calculateCognitiveLoad(metrics);

// Call Python service
const biosignalData = await this.callPythonService({
  cognitiveLoadScore,
  platform,
  participantId
});

// Cache result
this.cache.set(cacheKey, biosignalData);

return biosignalData;

}
private calculateCognitiveLoad(metrics: ParticipantMetrics): number {
// Same calculation as CognitiveLoadResults component
const normalizeTime = (time: number) => {
const min = 300, max = 1800;
return Math.min(Math.max((time - min) / (max - min), 0), 1) * 100;
};
const normalizeInteractions = (count: number) => {
  const min = 0, max = 20;
  return Math.min(Math.max(count / max, 0), 1) * 100;
};

const timeScore = normalizeTime(metrics.timeSpent) * 0.20;
const interactionScore = normalizeInteractions(metrics.interactionCount) * 0.20;
const clarificationScore = metrics.clarificationRequests * 5 * 0.15;
const assessmentTimeScore = normalizeTime(metrics.assessmentTime) * 0.25;
const accuracyScore = (1 - metrics.assessmentAccuracy) * 100 * 0.20;

const totalScore = Math.round(
  timeScore + 
  interactionScore + 
  clarificationScore + 
  assessmentTimeScore + 
  accuracyScore
);

return Math.min(Math.max(totalScore, 0), 100);

}
private async callPythonService(params: any): Promise<BiosignalData> {
return new Promise((resolve, reject) => {
// Send request to Python service via stdin
const request = JSON.stringify({
action: 'generate',
...params
}) + '\n';
  this.pythonProcess.stdin.write(request);
  
  // Wait for response
  const responseHandler = (data: Buffer) => {
    try {
      const response = JSON.parse(data.toString());
      this.pythonProcess.stdout.removeListener('data', responseHandler);
      resolve(response);
    } catch (error) {
      reject(error);
    }
  };
  
  this.pythonProcess.stdout.on('data', responseHandler);
  
  // Timeout after 30 seconds
  setTimeout(() => {
    this.pythonProcess.stdout.removeListener('data', responseHandler);
    reject(new Error('Python service timeout'));
  }, 30000);
});

}
private getCacheKey(participantId: string, metrics: ParticipantMetrics): string {
return ${participantId}-${JSON.stringify(metrics)};
}
}
export const biosignalService = new BiosignalService();
3.2 Python Bridge Server
backend/services/python/biosignal_server.py
import sys
import json
from chronosService import generator
def handle_request(request_data):
"""Handle biosignal generation request"""
try:
    action = request_data.get('action')
    
    if action == 'generate':
        cognitive_load_score = request_data['cognitiveLoadScore']
        platform = request_data['platform']
        participant_id = request_data['participantId']
        
        # Generate timeline
        timeline, level = generator.generate_aggregated_timeline(
            cognitive_load_score,
            num_points=50
        )
        
        # Generate brainwaves
        brainwaves = generator.generate_brainwave_patterns(
            cognitive_load_score,
            num_points=50
        )
        
        # Prepare response
        response = {
            'cognitiveLoadTimeline': timeline.tolist(),
            'brainwavePatterns': {
                'theta': brainwaves['theta'].tolist(),
                'alpha': brainwaves['alpha'].tolist(),
                'beta': brainwaves['beta'].tolist()
            },
            'metadata': {
                'cognitiveLoadScore': float(cognitive_load_score),
                'loadLevel': level,
                'platform': platform,
                'generatedAt': str(pd.Timestamp.now())
            }
        }
        
        return response
    
    else:
        return {'error': f'Unknown action: {action}'}

except Exception as e:
    return {'error': str(e)}

def main():
"""Main server loop"""
print("Biosignal generation server started", flush=True)

# Read requests from stdin
for line in sys.stdin:
    try:
        request = json.loads(line.strip())
        response = handle_request(request)
        
        # Write response to stdout
        print(json.dumps(response), flush=True)
    
    except Exception as e:
        error_response = {'error': str(e)}
        print(json.dumps(error_response), flush=True)

if name == "main":
main()
3.3 Express API Endpoints
// backend/routes/biosignalRoutes.ts
import express from 'express';
import { biosignalService } from '../services/biosignalService';
const router = express.Router();
/**
•	POST /api/biosignals/generate
•	Generate biosignal data for a participant
*/
router.post('/generate', async (req, res) => {
try {
const { participantId, metrics, platform } = req.body;
// Validate input
if (!participantId || !metrics || !platform) {
return res.status(400).json({
error: 'Missing required fields: participantId, metrics, platform'
});
}
// Generate biosignals
const biosignalData = await biosignalService.generateBiosignals(
participantId,
metrics,
platform
);
res.json({
success: true,
data: biosignalData
});
} catch (error) {
console.error('Biosignal generation error:', error);
res.status(500).json({
error: 'Failed to generate biosignals',
message: error.message
});
}
});
/**
•	GET /api/biosignals/:participantId
•	Retrieve cached biosignal data
*/
router.get('/:participantId', async (req, res) => {
try {
const { participantId } = req.params;
// Check if cached data exists
const cachedData = biosignalService.getCachedData(participantId);
if (!cachedData) {
return res.status(404).json({
error: 'No biosignal data found for this participant'
});
}
res.json({
success: true,
data: cachedData
});
} catch (error) {
res.status(500).json({
error: 'Failed to retrieve biosignals',
message: error.message
});
}
});
export default router;
Deliverables
•	[ ] Backend API implemented
•	[ ] Python bridge functional
•	[ ] Caching system operational
•	[ ] API documentation complete
________________________________________
Phase 4: Frontend Integration (Week 4)
Objectives
•	Create biosignal visualization components
•	Integrate with existing participant dashboard
•	Add loading states and error handling
•	Implement real-time updates
Tasks
4.1 Biosignal Service (Frontend)
// src/services/biosignalApi.ts
interface BiosignalData {
cognitiveLoadTimeline: number[];
brainwavePatterns: {
theta: number[];
alpha: number[];
beta: number[];
};
metadata: {
cognitiveLoadScore: number;
loadLevel: string;
platform: string;
generatedAt: string;
};
}
export class BiosignalAPI {
private baseURL: string;
constructor(baseURL = '/api/biosignals') {
this.baseURL = baseURL;
}
async generateBiosignals(
participantId: string,
metrics: any,
platform: 'chatgpt' | 'google'
): Promise<BiosignalData> {
const response = await fetch(`${this.baseURL}/generate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    participantId,
    metrics,
    platform
  })
});

if (!response.ok) {
  throw new Error(`Failed to generate biosignals: ${response.statusText}`);
}

const result = await response.json();
return result.data;

}
async getBiosignals(participantId: string): Promise<BiosignalData | null> {
try {
const response = await fetch(${this.baseURL}/${participantId});
  if (response.status === 404) {
    return null;
  }
  
  if (!response.ok) {
    throw new Error(`Failed to fetch biosignals: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.data;
  
} catch (error) {
  console.error('Error fetching biosignals:', error);
  return null;
}

}
}
export const biosignalAPI = new BiosignalAPI();
4.2 Biosignal Visualization Component
// src/components/BiosignalVisualization.tsx
import React, { useEffect, useState } from 'react';
import {
LineChart,
Line,
XAxis,
YAxis,
CartesianGrid,
Tooltip,
Legend,
ResponsiveContainer
} from 'recharts';
import { biosignalAPI } from '../services/biosignalApi';
interface BiosignalVisualizationProps {
participantId: string;
participantName: string;
metrics: any;
platform: 'chatgpt' | 'google';
}
export const BiosignalVisualization: React.FC<BiosignalVisualizationProps> = ({
participantId,
participantName,
metrics,
platform
}) => {
const [biosignalData, setBiosignalData] = useState<any>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
useEffect(() => {
generateBiosignals();
}, [participantId]);
const generateBiosignals = async () => {
try {
setLoading(true);
setError(null);
  const data = await biosignalAPI.generateBiosignals(
    participantId,
    metrics,
    platform
  );
  
  setBiosignalData(data);
  
} catch (err: any) {
  setError(err.message);
} finally {
  setLoading(false);
}

};
if (loading) {
return (


Generating biosignal visualizations...

);
}
if (error) {
return (

Failed to generate biosignals: {error}
Retry

);
}
if (!biosignalData) {
return null;
}
// Prepare data for charts
const timelineData = biosignalData.cognitiveLoadTimeline.map((value: number, index: number) => ({
time: index,
cognitiveLoad: value
}));
const brainwaveData = biosignalData.brainwavePatterns.theta.map((_: any, index: number) => ({
time: index,
theta: biosignalData.brainwavePatterns.theta[index],
alpha: biosignalData.brainwavePatterns.alpha[index],
beta: biosignalData.brainwavePatterns.beta[index]
}));
return (
<div className="biosignal-visualization">
EEG Monitor - {participantName}
Live EEG 
{biosignalData.metadata.loadLevel.toUpperCase()} Load

Score: {biosignalData.metadata.cognitiveLoadScore}

  {/* Cognitive Load Timeline */}
  <div className="chart-container">
    <h3>Cognitive Load Timeline (50 data points)</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={timelineData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="time" 
          label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
        />
        <YAxis 
          domain={[0, 100]}
          label={{ value: 'Cognitive Load', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="cognitiveLoad" 
          stroke="#ff5454" 
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
  
  {/* Brain Wave Patterns */}
  <div className="chart-container">
    <h3>Brain Wave Patterns (Hz Power)</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={brainwaveData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="time"
          label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
        />
        <YAxis 
          label={{ value: 'Power (Hz)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="theta" 
          stroke="#4287f5" 
          strokeWidth={2}
          name="Theta (4-8 Hz)"
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="alpha" 
          stroke="#42f554" 
          strokeWidth={2}
          name="Alpha (8-12 Hz)"
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="beta" 
          stroke="#f54242" 
          strokeWidth={2}
          name="Beta (12-30 Hz)"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
  
  {/* Metadata */}
  <div className="biosignal-footer">
    <p className="caption">
      Generated using Chronos foundation model with cognitive load dataset
    </p>
    <p className="timestamp">
      Generated at: {new Date(biosignalData.metadata.generatedAt).toLocaleString()}
    </p>
  </div>
</div>

);
};
4.3 Integration with Participant Dashboard
// Update src/components/ParticipantDashboard.tsx
import { BiosignalVisualization } from './BiosignalVisualization';
// Add to ParticipantDashboard component
{participant.currentPhase === 'completed' && (

)}
4.4 Styling
/* src/styles/biosignal.css */
.biosignal-visualization {
background: var(--color-surface);
border-radius: var(--radius-lg);
padding: var(--space-24);
margin-top: var(--space-24);
border: 1px solid var(--color-card-border);
}
.biosignal-header {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: var(--space-24);
padding-bottom: var(--space-16);
border-bottom: 1px solid var(--color-border);
}
.biosignal-header h2 {
font-size: var(--font-size-2xl);
color: var(--color-text);
margin: 0;
}
.biosignal-metadata {
display: flex;
gap: var(--space-12);
align-items: center;
}
.biosignal-metadata .badge {
background: rgba(var(--color-success-rgb), 0.15);
color: var(--color-success);
padding: var(--space-4) var(--space-12);
border-radius: var(--radius-full);
font-size: var(--font-size-sm);
font-weight: var(--font-weight-medium);
}
.biosignal-metadata .load-level {
font-weight: var(--font-weight-semibold);
color: var(--color-text-secondary);
}
.biosignal-metadata .score {
background: var(--color-primary);
color: var(--color-btn-primary-text);
padding: var(--space-6) var(--space-16);
border-radius: var(--radius-base);
font-weight: var(--font-weight-bold);
}
.chart-container {
margin-bottom: var(--space-32);
}
.chart-container h3 {
font-size: var(--font-size-lg);
margin-bottom: var(--space-16);
color: var(--color-text);
}
.biosignal-footer {
margin-top: var(--space-24);
padding-top: var(--space-16);
border-top: 1px solid var(--color-border);
text-align: center;
}
.biosignal-footer .caption {
font-size: var(--font-size-sm);
color: var(--color-text-secondary);
margin-bottom: var(--space-8);
}
.biosignal-footer .timestamp {
font-size: var(--font-size-xs);
color: var(--color-text-secondary);
font-family: var(--font-family-mono);
}
.biosignal-loading {
text-align: center;
padding: var(--space-32);
}
.biosignal-loading .spinner {
width: 40px;
height: 40px;
border: 4px solid var(--color-secondary);
border-top-color: var(--color-primary);
border-radius: 50%;
animation: spin 1s linear infinite;
margin: 0 auto var(--space-16);
}
@keyframes spin {
to { transform: rotate(360deg); }
}
.biosignal-error {
text-align: center;
padding: var(--space-32);
color: var(--color-error);
}
.biosignal-error button {
margin-top: var(--space-16);
background: var(--color-primary);
color: var(--color-btn-primary-text);
border: none;
padding: var(--space-8) var(--space-24);
border-radius: var(--radius-base);
cursor: pointer;
font-weight: var(--font-weight-medium);
}
Deliverables
•	[ ] Frontend components implemented
•	[ ] Charts rendering correctly
•	[ ] Loading states functional
•	[ ] Error handling complete
________________________________________
Phase 5: Testing & Validation (Week 5)
Objectives
•	Validate biosignal accuracy
•	Performance testing
•	Cross-browser compatibility
•	User acceptance testing
Tasks
5.1 Validation Metrics
tests/validate_biosignals.py
import numpy as np
from scipy import stats
from chronosService import generator
def validate_load_correlation():
"""Validate that generated signals correlate with cognitive load levels"""
load_levels = [10, 30, 50, 70, 90]
results = []

for load in load_levels:
    # Generate multiple samples
    samples = []
    for _ in range(10):
        timeline, level = generator.generate_aggregated_timeline(load)
        mean_load = np.mean(timeline)
        samples.append(mean_load)
    
    avg_generated = np.mean(samples)
    std_generated = np.std(samples)
    
    results.append({
        'target_load': load,
        'generated_mean': avg_generated,
        'generated_std': std_generated,
        'error': abs(load - avg_generated)
    })

# Calculate correlation
targets = [r['target_load'] for r in results]
generated = [r['generated_mean'] for r in results]

correlation, p_value = stats.pearsonr(targets, generated)

print("Validation Results:")
print(f"Correlation: {correlation:.3f} (p-value: {p_value:.4f})")
print("\nDetailed Results:")
for r in results:
    print(f"  Target: {r['target_load']:>2d} | "
          f"Generated: {r['generated_mean']:>5.1f} ± {r['generated_std']:>4.1f} | "
          f"Error: {r['error']:>4.1f}")

return correlation > 0.95  # Should be highly correlated

def validate_frequency_bands():
"""Validate that frequency bands behave correctly with load changes"""
low_load_bands = generator.generate_brainwave_patterns(20)
high_load_bands = generator.generate_brainwave_patterns(80)

# Alpha should decrease with load
low_alpha_mean = np.mean(low_load_bands['alpha'])
high_alpha_mean = np.mean(high_load_bands['alpha'])
alpha_decreases = low_alpha_mean > high_alpha_mean

# Beta should increase with load
low_beta_mean = np.mean(low_load_bands['beta'])
high_beta_mean = np.mean(high_load_bands['beta'])
beta_increases = high_beta_mean > low_beta_mean

# Theta should increase with load
low_theta_mean = np.mean(low_load_bands['theta'])
high_theta_mean = np.mean(high_load_bands['theta'])
theta_increases = high_theta_mean > low_theta_mean

print("\nFrequency Band Validation:")
print(f"  Alpha decreases with load: {alpha_decreases} "
      f"({low_alpha_mean:.1f} → {high_alpha_mean:.1f})")
print(f"  Beta increases with load: {beta_increases} "
      f"({low_beta_mean:.1f} → {high_beta_mean:.1f})")
print(f"  Theta increases with load: {theta_increases} "
      f"({low_theta_mean:.1f} → {high_theta_mean:.1f})")

return alpha_decreases and beta_increases and theta_increases

if name == "main":
load_valid = validate_load_correlation()
bands_valid = validate_frequency_bands()
if load_valid and bands_valid:
    print("\n✅ All validations passed!")
else:
    print("\n❌ Some validations failed")

5.2 Performance Benchmarks
tests/benchmark_performance.py
import time
import psutil
import numpy as np
from chronosService import generator
def benchmark_generation():
"""Benchmark biosignal generation performance"""
print("Performance Benchmarks:")
print("=" * 60)

# Memory before
process = psutil.Process()
mem_before = process.memory_info().rss / 1024 / 1024  # MB

# Benchmark timeline generation
start = time.time()
for _ in range(10):
    timeline, level = generator.generate_aggregated_timeline(50)
timeline_time = (time.time() - start) / 10

# Benchmark brainwave generation
start = time.time()
for _ in range(10):
    brainwaves = generator.generate_brainwave_patterns(50)
brainwave_time = (time.time() - start) / 10

# Memory after
mem_after = process.memory_info().rss / 1024 / 1024  # MB
mem_used = mem_after - mem_before

print(f"Timeline Generation: {timeline_time*1000:.1f} ms/request")
print(f"Brainwave Generation: {brainwave_time*1000:.1f} ms/request")
print(f"Total Time: {(timeline_time + brainwave_time)*1000:.1f} ms/request")
print(f"Memory Usage: {mem_used:.1f} MB")
print("=" * 60)

# Check if meets requirements
total_time = timeline_time + brainwave_time
meets_requirements = total_time < 5  # Should be under 5 seconds

if meets_requirements:
    print("✅ Performance meets requirements (<5s per participant)")
else:
    print("⚠️  Performance optimization needed")

return meets_requirements

if name == "main":
benchmark_generation()
5.3 Integration Tests
// tests/integration/biosignal.test.ts
import { describe, it, expect } from '@jest/globals';
import { biosignalAPI } from '../../src/services/biosignalApi';
describe('Biosignal Integration Tests', () => {
it('should generate biosignals for low cognitive load', async () => {
const metrics = {
interactionCount: 5,
clarificationRequests: 0,
assessmentTime: 400,
assessmentAccuracy: 0.9,
timeSpent: 600
};
const data = await biosignalAPI.generateBiosignals(
  'test-participant-1',
  metrics,
  'chatgpt'
);

expect(data).toBeDefined();
expect(data.cognitiveLoadTimeline).toHaveLength(50);
expect(data.brainwavePatterns.theta).toHaveLength(50);
expect(data.metadata.cognitiveLoadScore).toBeLessThan(40);

});
it('should generate biosignals for high cognitive load', async () => {
const metrics = {
interactionCount: 18,
clarificationRequests: 5,
assessmentTime: 1500,
assessmentAccuracy: 0.4,
timeSpent: 1700
};
const data = await biosignalAPI.generateBiosignals(
  'test-participant-2',
  metrics,
  'google'
);

expect(data).toBeDefined();
expect(data.metadata.cognitiveLoadScore).toBeGreaterThan(60);
expect(data.metadata.loadLevel).toBe('highlevel');

});
it('should cache results correctly', async () => {
const metrics = {
interactionCount: 10,
clarificationRequests: 2,
assessmentTime: 800,
assessmentAccuracy: 0.7,
timeSpent: 900
};
// First call
const start1 = Date.now();
await biosignalAPI.generateBiosignals(
  'test-participant-3',
  metrics,
  'chatgpt'
);
const time1 = Date.now() - start1;

// Second call (should be cached)
const start2 = Date.now();
await biosignalAPI.generateBiosignals(
  'test-participant-3',
  metrics,
  'chatgpt'
);
const time2 = Date.now() - start2;

// Cached call should be significantly faster
expect(time2).toBeLessThan(time1 * 0.5);

});
});
Deliverables
•	[ ] All validation tests passing
•	[ ] Performance benchmarks met
•	[ ] Integration tests complete
•	[ ] UAT feedback collected
________________________________________
Technical Stack
Backend
•	Runtime: Node.js 18+
•	Framework: Express.js
•	Language: TypeScript
•	Python Bridge: Child process communication
•	Caching: In-memory Map (can upgrade to Redis)
Python Services
•	Python: 3.9+
•	ML Framework: PyTorch
•	Foundation Model: Chronos (HuggingFace)
•	Signal Processing: SciPy, NumPy
•	Data Handling: Pandas
Frontend
•	Framework: React + TypeScript
•	Charts: Recharts
•	HTTP Client: Fetch API
•	State Management: React hooks
Infrastructure
•	Development: Docker containers
•	Production: AWS Lambda + S3 (model storage)
•	Monitoring: CloudWatch logs
________________________________________
API Design
Endpoints
POST /api/biosignals/generate
Generate biosignal data for a participant.
Request:
{
"participantId": "p1234567890",
"metrics": {
"interactionCount": 12,
"clarificationRequests": 3,
"assessmentTime": 1200,
"assessmentAccuracy": 0.75,
"timeSpent": 900
},
"platform": "chatgpt"
}
Response:
{
"success": true,
"data": {
"cognitiveLoadTimeline": [45.2, 47.1, 48.9, ...],
"brainwavePatterns": {
"theta": [38.5, 39.2, ...],
"alpha": [52.3, 51.8, ...],
"beta": [42.1, 43.5, ...]
},
"metadata": {
"cognitiveLoadScore": 46,
"loadLevel": "moderate",
"platform": "chatgpt",
"generatedAt": "2025-11-29T20:00:00Z"
}
}
}
GET /api/biosignals/:participantId
Retrieve cached biosignal data.
Response:
{
"success": true,
"data": {
"cognitiveLoadTimeline": [...],
"brainwavePatterns": {...},
"metadata": {...}
}
}
________________________________________
Validation Strategy
Scientific Validation
1.	Correlation Analysis
o	Verify generated cognitive load correlates with input metrics
o	Target: r > 0.95 (Pearson correlation)
2.	Frequency Band Validation
o	Alpha band decreases with cognitive load
o	Beta band increases with cognitive load
o	Theta band increases with cognitive load
3.	Pattern Consistency
o	Generated patterns match dataset characteristics
o	Statistical distribution matches reference data
Technical Validation
1.	Performance
o	Generation time < 5 seconds per participant
o	Memory usage < 500 MB
o	API response time < 10 seconds
2.	Reliability
o	99% success rate for generation
o	Error handling for all edge cases
o	Graceful fallback when model unavailable
3.	Accuracy
o	Cognitive load score within ±5% of calculated value
o	Frequency band ratios match expected patterns
________________________________________
Timeline & Milestones
Week 1: Dataset Preparation (Nov 30 - Dec 6)
•	[x] Download Mendeley dataset
•	[ ] Analyze EEG patterns
•	[ ] Create reference pattern database
•	[ ] Document baseline characteristics
Week 2: Model Integration (Dec 7 - Dec 13)
•	[ ] Set up Chronos environment
•	[ ] Implement generation pipeline
•	[ ] Test zero-shot forecasting
•	[ ] Validate against reference patterns
Week 3: Backend Development (Dec 14 - Dec 20)
•	[ ] Build Express API endpoints
•	[ ] Create Python bridge service
•	[ ] Implement caching system
•	[ ] Add error handling
Week 4: Frontend Integration (Dec 21 - Dec 27)
•	[ ] Create visualization components
•	[ ] Integrate with dashboard
•	[ ] Add loading/error states
•	[ ] Style and polish UI
Week 5: Testing & Deployment (Dec 28 - Jan 3)
•	[ ] Run validation tests
•	[ ] Performance benchmarking
•	[ ] Integration testing
•	[ ] Deploy to production
Target Launch: January 3, 2026
________________________________________
Risk Mitigation
Technical Risks
Risk	Impact	Mitigation
Chronos model too slow	High	Pre-generate patterns, optimize inference
Memory constraints	Medium	Use batching, implement streaming
API timeout	Medium	Async processing, background jobs
Dataset quality issues	High	Validate early, use multiple datasets

Scientific Risks
Risk	Impact	Mitigation
Generated patterns unrealistic	High	Validate against literature, expert review
Poor cognitive load correlation	High	Refine mapping algorithm, add calibration
Frequency bands incorrect	Medium	Use established research parameters

________________________________________
Success Metrics
1.	Generation Accuracy: 95% correlation with target cognitive load
2.	Performance: <5s generation time per participant
3.	Reliability: 99% uptime for biosignal service
4.	User Satisfaction: Visualizations perceived as realistic and helpful
________________________________________
References
[1] Cognitive Load Assessment Through EEG Dataset. Mendeley Data. DOI: 10.17632/kt38js3jv7.1. https://data.mendeley.com/datasets/kt38js3jv7/1
[2] Ansari, A. et al. (2024). "Chronos: Learning the Language of Time Series." Amazon Science. https://arxiv.org/abs/2403.07815
[3] Yang, C. et al. (2023). "BIOT: Biosignal Transformer for Cross-data Learning in the Wild." NeurIPS 2023.
[4] OpenBCI. (2024). "EEG Electrode Cap Kit with Cyton Board." https://openbci.com
________________________________________
Appendices
A. Dataset File Structure
eeg_dataset/
├── raw_data/
│ ├── Arithmetic_Data/
│ │ ├── natural-1.txt to natural-15.txt
│ │ ├── lowlevel-1.txt to lowlevel-15.txt
│ │ ├── midlevel-1.txt to midlevel-15.txt
│ │ └── highlevel-1.txt to highlevel-15.txt
│ └── Stroop_Data/
│ └── [same structure]
└── processed_data/
├── analysis_results.pkl
└── reference_patterns.pkl
B. Cognitive Load Calculation Formula
cognitiveLoad =
normalize(timeSpent, 300, 1800) * 0.20 +
normalize(interactionCount, 0, 20) * 0.20 +
clarificationRequests * 5 * 0.15 +
normalize(assessmentTime, 0, 1800) * 0.25 +
(1 - assessmentAccuracy) * 100 * 0.20
C. Frequency Band Characteristics
Band	Frequency	Associated With
Theta	4-8 Hz	Working memory, cognitive processing
Alpha	8-13 Hz	Relaxed awareness, decreases with task load
Beta	13-30 Hz	Active thinking, increases with concentration
Gamma	30-50 Hz	High-level information processing

D. Hardware Specifications (Reference)
OpenBCI Cyton Board:
•	8 EEG channels
•	24-bit resolution
•	250 Hz sampling rate
•	10-20 electrode placement system
Channels Used in Dataset:
•	Fp1, Fp2: Frontal pole (attention)
•	F7, F3, FZ, F4, F8: Frontal (executive function)
•	C2: Central (motor/sensory)
________________________________________
Document Version: 1.0
Last Updated: November 29, 2025
Author: Cognitive Load Analysis Platform Team
Status: Ready for Implementation
