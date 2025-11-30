"""
Chronos EEG Generator - Synthetic biosignal generation using Amazon Chronos.

Uses the Chronos foundation model for time series forecasting to generate
realistic EEG patterns based on cognitive load levels and user behavior events.
"""
import torch
import numpy as np
from scipy import signal as scipy_signal
from typing import Dict, Tuple, Optional, List
import logging
import math

from .config import config
from .preprocessing import get_preprocessor

logger = logging.getLogger(__name__)


# ============================================================================
# Behavior Modulation Constants
# ============================================================================

# Phase-specific baseline cognitive load profiles
PHASE_BASELINES = {
    'idle': {'alpha': 1.0, 'beta': 1.0, 'theta': 1.0, 'baseLoad': 20},
    'research': {'alpha': 0.95, 'beta': 1.05, 'theta': 1.08, 'baseLoad': 40},
    'assessment': {'alpha': 0.85, 'beta': 1.15, 'theta': 1.12, 'baseLoad': 65},
    'creativity': {'alpha': 1.10, 'beta': 0.95, 'theta': 1.15, 'baseLoad': 55},
    'results': {'alpha': 1.05, 'beta': 0.98, 'theta': 1.0, 'baseLoad': 30},
}

# Event-to-EEG modulation mapping (multipliers and duration in ms)
EVENT_MODULATION = {
    # Time pressure events
    'time_warning': {'alpha': 0.92, 'beta': 1.12, 'theta': 1.05, 'duration': 8000},
    'timer_expired': {'alpha': 0.85, 'beta': 1.20, 'theta': 1.15, 'duration': 10000},
    # Assessment events
    'answer_submitted_correct': {'alpha': 1.10, 'beta': 0.95, 'theta': 1.0, 'duration': 4000},
    'answer_submitted_incorrect': {'alpha': 0.90, 'beta': 1.15, 'theta': 1.10, 'duration': 6000},
    'answer_changed': {'alpha': 0.95, 'beta': 1.05, 'theta': 1.08, 'duration': 4000},
    'question_started': {'alpha': 0.98, 'beta': 1.03, 'theta': 1.02, 'duration': 3000},
    # Research events
    'query_submitted': {'alpha': 1.0, 'beta': 1.03, 'theta': 1.05, 'duration': 3000},
    'search_result_clicked': {'alpha': 1.02, 'beta': 1.0, 'theta': 1.02, 'duration': 2000},
    'topic_changed': {'alpha': 0.93, 'beta': 1.08, 'theta': 1.08, 'duration': 5000},
    'off_topic_detected': {'alpha': 0.95, 'beta': 1.05, 'theta': 1.05, 'duration': 4000},
    'clarification_request': {'alpha': 0.95, 'beta': 1.08, 'theta': 1.10, 'duration': 5000},
    # Creativity events
    'creative_typing': {'alpha': 1.08, 'beta': 0.97, 'theta': 1.03, 'duration': 3000},
    'creative_typing_started': {'alpha': 1.05, 'beta': 0.98, 'theta': 1.05, 'duration': 5000},
    'creative_typing_active': {'alpha': 1.08, 'beta': 0.97, 'theta': 1.03, 'duration': 3000},
    'creative_response_submitted': {'alpha': 1.10, 'beta': 0.95, 'theta': 0.98, 'duration': 4000},
    # General events
    'phase_started': {'alpha': 0.98, 'beta': 1.02, 'theta': 1.02, 'duration': 3000},
    'phase_completed': {'alpha': 1.08, 'beta': 0.95, 'theta': 0.98, 'duration': 5000},
    'idle_detected': {'alpha': 1.05, 'beta': 0.95, 'theta': 0.98, 'duration': 5000},
}

# Exponential decay constant (10s half-life)
DECAY_HALF_LIFE_MS = 10000
DECAY_CONSTANT = math.log(2) / DECAY_HALF_LIFE_MS


class ChronosEEGGenerator:
    """
    Generate synthetic EEG signals using Amazon Chronos foundation model.
    
    This class uses reference patterns from the Mendeley cognitive load dataset
    as seed data, then applies Chronos for zero-shot time series forecasting
    to generate realistic EEG variations.
    """
    
    def __init__(self, model_name: Optional[str] = None, lazy_load: bool = True):
        """
        Initialize the Chronos EEG generator.
        
        Args:
            model_name: Chronos model to use (default from config)
            lazy_load: If True, defer model loading until first use
        """
        self.model_name = model_name or config.CHRONOS_MODEL
        self.device = config.DEVICE
        self.pipeline = None
        self.reference_patterns = None
        
        if not lazy_load:
            self._load_model()
            self._load_reference_patterns()
    
    def _load_model(self) -> None:
        """Load Chronos model from HuggingFace."""
        if self.pipeline is not None:
            return
        
        try:
            from chronos import ChronosPipeline
            
            logger.info(f"Loading Chronos model: {self.model_name}")
            self.pipeline = ChronosPipeline.from_pretrained(
                self.model_name,
                device_map=self.device,
                torch_dtype=torch.bfloat16 if self.device == 'cuda' else torch.float32
            )
            logger.info("Chronos model loaded successfully")
        except ImportError:
            logger.warning("Chronos not available, using fallback generation")
            self.pipeline = None
        except Exception as e:
            logger.error(f"Failed to load Chronos model: {e}")
            self.pipeline = None
    
    def _load_reference_patterns(self) -> None:
        """Load reference EEG patterns from preprocessed dataset."""
        if self.reference_patterns is not None:
            return
        
        preprocessor = get_preprocessor()
        self.reference_patterns = preprocessor.preprocess(use_synthetic_if_missing=True)
        logger.info("Reference patterns loaded")
    
    def _ensure_initialized(self) -> None:
        """Ensure model and patterns are loaded."""
        self._load_reference_patterns()
        # Note: Model loading is optional - we have fallback generation
    
    def map_load_to_level(self, cognitive_load_score: float) -> str:
        """
        Map cognitive load score (0-100) to dataset load level.
        
        Args:
            cognitive_load_score: Score from 0-100
            
        Returns:
            Load level string: 'natural', 'lowlevel', 'midlevel', or 'highlevel'
        """
        for level, (low, high) in config.LOAD_THRESHOLDS.items():
            if low <= cognitive_load_score < high:
                return level
        return 'highlevel'  # Default for scores >= 75
    
    def select_seed_pattern(self, cognitive_load_score: float, 
                           task: str = 'Arithmetic_Data') -> Tuple[np.ndarray, str]:
        """
        Select appropriate seed pattern based on cognitive load score.
        
        Args:
            cognitive_load_score: Score from 0-100
            task: Task type ('Arithmetic_Data' or 'Stroop_Data')
            
        Returns:
            Tuple of (seed pattern array, load level string)
        """
        self._ensure_initialized()
        
        level = self.map_load_to_level(cognitive_load_score)
        
        # Debug logging
        logger.info(f"Selecting pattern: task={task}, level={level}")
        logger.info(f"Available tasks: {list(self.reference_patterns.keys())}")
        if task in self.reference_patterns:
            logger.info(f"Available levels for {task}: {list(self.reference_patterns[task].keys())}")
        
        # Handle missing task/level gracefully
        if task not in self.reference_patterns:
            available_tasks = list(self.reference_patterns.keys())
            if available_tasks:
                task = available_tasks[0]
                logger.warning(f"Task not found, using {task}")
            else:
                raise ValueError("No reference patterns available")
        
        if level not in self.reference_patterns[task]:
            available_levels = list(self.reference_patterns[task].keys())
            if available_levels:
                level = available_levels[0]
                logger.warning(f"Level not found, using {level}")
            else:
                raise ValueError(f"No levels available for task {task}")
        
        pattern = self.reference_patterns[task][level]
        
        return pattern['raw_signal'], level
    
    def _generate_with_chronos(self, context: np.ndarray, 
                                prediction_length: int) -> np.ndarray:
        """
        Generate new samples using Chronos model.
        
        Args:
            context: Input context signal
            prediction_length: Number of samples to generate
            
        Returns:
            Generated signal array
        """
        self._load_model()
        
        if self.pipeline is None:
            # Fallback: simple extrapolation with noise
            return self._fallback_generation(context, prediction_length)
        
        try:
            context_tensor = torch.tensor(context).float().unsqueeze(0)
            
            forecast = self.pipeline.predict(
                context=context_tensor,
                prediction_length=prediction_length,
                num_samples=1
            )
            
            return forecast[0].numpy().flatten()
        except Exception as e:
            logger.warning(f"Chronos generation failed: {e}, using fallback")
            return self._fallback_generation(context, prediction_length)
    
    def _fallback_generation(self, context: np.ndarray, 
                             prediction_length: int) -> np.ndarray:
        """
        Fallback generation when Chronos is not available.
        Uses signal characteristics to generate realistic continuations.
        """
        # Analyze context signal characteristics
        mean_val = np.mean(context)
        std_val = np.std(context)
        
        # Generate continuation with similar characteristics
        t = np.linspace(0, prediction_length / 250, prediction_length)
        
        # Extract dominant frequency using FFT
        fft_result = np.fft.fft(context)
        freqs = np.fft.fftfreq(len(context), 1/250)
        dominant_idx = np.argmax(np.abs(fft_result[1:len(fft_result)//2])) + 1
        dominant_freq = abs(freqs[dominant_idx])
        
        # Generate signal with similar characteristics
        base_signal = np.sin(2 * np.pi * dominant_freq * t + np.random.random() * np.pi)
        noise = np.random.randn(prediction_length) * std_val * 0.3
        
        generated = mean_val + base_signal * std_val * 0.7 + noise
        
        return generated
    
    def generate_session_timeline(self, cognitive_load_score: float,
                                   duration_minutes: int = 15,
                                   channel_idx: int = 3) -> Tuple[np.ndarray, str]:
        """
        Generate full session EEG timeline.
        
        Args:
            cognitive_load_score: Target cognitive load (0-100)
            duration_minutes: Session duration in minutes
            channel_idx: Which EEG channel to use (3 = F3, frontal cortex)
            
        Returns:
            Tuple of (full timeline array, load level)
        """
        self._ensure_initialized()
        
        # Get seed pattern
        seed_pattern, level = self.select_seed_pattern(cognitive_load_score)
        seed_signal = seed_pattern[:, channel_idx] if seed_pattern.ndim > 1 else seed_pattern
        
        # Generate in 1-minute segments
        segment_length = 250 * 60  # 1 minute at 250 Hz
        full_timeline = list(seed_signal[:250])  # Start with 1 second of seed
        
        for segment in range(duration_minutes):
            # Calculate temporal variation
            load_variation = self._calculate_temporal_variation(
                segment, duration_minutes, cognitive_load_score
            )
            
            # Use last 250 samples as context
            context = np.array(full_timeline[-250:])
            context = context * (1 + load_variation / 100)
            
            # Generate next segment
            generated = self._generate_with_chronos(context, min(segment_length, 2500))
            full_timeline.extend(generated)
        
        return np.array(full_timeline), level
    
    def _calculate_temporal_variation(self, current_minute: int,
                                       total_minutes: int,
                                       base_load: float) -> float:
        """
        Calculate cognitive load variation over time.
        
        Models:
        - Early phase: Adaptation (slightly lower load)
        - Middle phase: Peak engagement (baseline)
        - Late phase: Fatigue (slightly higher load)
        """
        progress = current_minute / total_minutes if total_minutes > 0 else 0
        
        if progress < 0.2:  # First 20% - adaptation
            return -5
        elif progress > 0.8:  # Last 20% - fatigue
            return 8
        else:
            return np.random.uniform(-3, 3)  # Natural variation
    
    def generate_aggregated_timeline(self, cognitive_load_score: float,
                                      num_points: int = 50) -> Tuple[np.ndarray, str]:
        """
        Generate aggregated cognitive load timeline for visualization.
        
        Args:
            cognitive_load_score: Target cognitive load (0-100)
            num_points: Number of data points in output (default 50)
            
        Returns:
            Tuple of (timeline array normalized to 0-100, load level)
        """
        self._ensure_initialized()
        
        # Get seed pattern
        seed_pattern, level = self.select_seed_pattern(cognitive_load_score)
        seed_signal = seed_pattern[:, 3] if seed_pattern.ndim > 1 else seed_pattern
        
        # Generate extended signal
        full_signal = []
        context = seed_signal[-250:] if len(seed_signal) >= 250 else seed_signal
        
        # Generate enough samples for num_points windows
        samples_needed = num_points * 50  # 50 samples per point
        
        while len(full_signal) < samples_needed:
            generated = self._generate_with_chronos(context, 250)
            full_signal.extend(generated)
            context = np.array(full_signal[-250:])
        
        full_signal = np.array(full_signal[:samples_needed])
        
        # Aggregate to num_points
        segment_size = len(full_signal) // num_points
        aggregated = []
        
        for i in range(num_points):
            start_idx = i * segment_size
            end_idx = start_idx + segment_size
            segment = full_signal[start_idx:end_idx]
            
            # Use RMS as representative value
            rms_value = np.sqrt(np.mean(segment ** 2))
            aggregated.append(rms_value)
        
        # Normalize to center around target cognitive load
        normalized = self._normalize_to_load_range(
            np.array(aggregated), cognitive_load_score
        )
        
        return normalized, level
    
    def _normalize_to_load_range(self, signal: np.ndarray,
                                  target_load: float) -> np.ndarray:
        """
        Normalize signal to center around target cognitive load (0-100).
        """
        # Standardize
        if signal.std() > 0:
            signal_std = (signal - signal.mean()) / signal.std()
        else:
            signal_std = signal - signal.mean()
        
        # Scale to ±15 range around target
        signal_scaled = signal_std * 10 + target_load
        
        # Clip to valid range
        return np.clip(signal_scaled, 0, 100)
    
    def generate_brainwave_patterns(self, cognitive_load_score: float,
                                     num_points: int = 50) -> Dict[str, np.ndarray]:
        """
        Generate frequency band patterns (theta, alpha, beta).
        
        Based on research findings:
        - High load → increased theta & beta, decreased alpha
        - Low load → decreased theta & beta, increased alpha
        
        Args:
            cognitive_load_score: Target cognitive load (0-100)
            num_points: Number of data points per band
            
        Returns:
            Dictionary with 'theta', 'alpha', 'beta' arrays
        """
        self._ensure_initialized()
        
        # Get seed pattern
        seed_pattern, level = self.select_seed_pattern(cognitive_load_score)
        eeg_signal = seed_pattern[:, 3] if seed_pattern.ndim > 1 else seed_pattern
        
        fs = config.SAMPLING_RATE
        
        bands = {
            'theta': (4, 8),
            'alpha': (8, 13),
            'beta': (13, 30)
        }
        
        band_patterns = {}
        
        for band_name, (low_freq, high_freq) in bands.items():
            # Design bandpass filter
            try:
                sos = scipy_signal.butter(
                    4, [low_freq, high_freq],
                    btype='band', fs=fs, output='sos'
                )
                
                # Apply filter
                filtered = scipy_signal.sosfilt(sos, eeg_signal)
                
                # Calculate power over time windows
                window_size = max(1, len(filtered) // num_points)
                power_timeline = []
                
                for i in range(num_points):
                    start = i * window_size
                    end = min(start + window_size, len(filtered))
                    if start >= len(filtered):
                        break
                    window_data = filtered[start:end]
                    power = np.mean(window_data ** 2)
                    power_timeline.append(power)
                
                # Pad if needed
                while len(power_timeline) < num_points:
                    power_timeline.append(power_timeline[-1] if power_timeline else 0)
                
                # Normalize
                power_array = np.array(power_timeline[:num_points])
                if power_array.max() > power_array.min():
                    normalized = (power_array - power_array.min()) / (power_array.max() - power_array.min())
                else:
                    normalized = np.zeros(num_points)
                
                # Scale based on cognitive load and band characteristics
                scaled = self._scale_band_for_load(normalized, band_name, cognitive_load_score)
                band_patterns[band_name] = scaled
                
            except Exception as e:
                logger.warning(f"Error processing {band_name} band: {e}")
                # Fallback: generate synthetic pattern
                band_patterns[band_name] = self._generate_synthetic_band(
                    band_name, cognitive_load_score, num_points
                )
        
        return band_patterns
    
    def _scale_band_for_load(self, normalized_signal: np.ndarray,
                              band_name: str,
                              cognitive_load: float) -> np.ndarray:
        """
        Scale frequency band based on cognitive load research findings.
        """
        load_factor = cognitive_load / 100  # 0 to 1
        
        if band_name == 'theta':
            # Theta increases with load (range: 30-70 Hz power)
            base = 30 + 20 * load_factor
            amplitude = 15
        elif band_name == 'alpha':
            # Alpha decreases with load (range: 60-35 Hz power)
            base = 60 - 25 * load_factor
            amplitude = 12
        elif band_name == 'beta':
            # Beta increases with load (range: 25-55 Hz power)
            base = 25 + 30 * load_factor
            amplitude = 10
        else:
            base = 40
            amplitude = 10
        
        return base + amplitude * normalized_signal
    
    def _generate_synthetic_band(self, band_name: str,
                                  cognitive_load: float,
                                  num_points: int) -> np.ndarray:
        """Generate synthetic frequency band pattern."""
        load_factor = cognitive_load / 100
        
        # Create smooth curve with variations
        t = np.linspace(0, 4 * np.pi, num_points)
        base_curve = np.sin(t) * 0.3 + np.sin(t * 2.5) * 0.2
        noise = np.random.randn(num_points) * 0.1
        
        normalized = (base_curve + noise + 1) / 2  # Normalize to 0-1
        
        return self._scale_band_for_load(normalized, band_name, cognitive_load)
    
    def generate_full_biosignal_data(self, cognitive_load_score: float,
                                      num_points: int = 50,
                                      behavior_modifiers: Optional[Dict] = None) -> Dict:
        """
        Generate complete biosignal data package for API response.
        
        Args:
            cognitive_load_score: Target cognitive load (0-100)
            num_points: Number of data points
            behavior_modifiers: Optional behavior-based modulation parameters
            
        Returns:
            Dictionary with timeline, brainwave patterns, and metadata
        """
        # Calculate effective modifiers from behavior events
        modifiers = self._calculate_behavior_modulation(behavior_modifiers)
        
        # Adjust base cognitive load based on phase
        effective_load = self._adjust_load_for_phase(
            cognitive_load_score, behavior_modifiers
        )
        
        # Generate cognitive load timeline
        timeline, level = self.generate_aggregated_timeline(
            effective_load, num_points
        )
        
        # Apply behavior modulation to timeline
        timeline = self._apply_timeline_modulation(timeline, modifiers, behavior_modifiers)
        
        # Generate brainwave patterns with behavior modulation
        brainwaves = self.generate_brainwave_patterns(
            effective_load, num_points
        )
        
        # Apply band-specific modulation
        brainwaves = self._apply_band_modulation(brainwaves, modifiers)
        
        return {
            'cognitiveLoadTimeline': timeline.tolist(),
            'brainwavePatterns': {
                'theta': brainwaves['theta'].tolist(),
                'alpha': brainwaves['alpha'].tolist(),
                'beta': brainwaves['beta'].tolist()
            },
            'metadata': {
                'cognitiveLoadScore': float(cognitive_load_score),
                'effectiveLoad': float(effective_load),
                'loadLevel': level,
                'numPoints': num_points,
                'samplingRate': config.SAMPLING_RATE,
                'channels': config.CHANNELS,
                'behaviorModulation': {
                    'alphaModifier': modifiers['alpha'],
                    'betaModifier': modifiers['beta'],
                    'thetaModifier': modifiers['theta'],
                    'phase': behavior_modifiers.get('currentPhase', 'unknown') if behavior_modifiers else 'unknown'
                }
            }
        }
    
    def _calculate_behavior_modulation(self, behavior_modifiers: Optional[Dict]) -> Dict[str, float]:
        """
        Calculate combined EEG band modifiers from behavior events.
        
        Uses exponential decay model with 10-second half-life.
        """
        base_modifiers = {'alpha': 1.0, 'beta': 1.0, 'theta': 1.0}
        
        if not behavior_modifiers:
            return base_modifiers
        
        # Apply phase baseline if specified
        current_phase = behavior_modifiers.get('currentPhase', 'idle')
        phase_baseline = PHASE_BASELINES.get(current_phase, PHASE_BASELINES['idle'])
        
        alpha = phase_baseline['alpha']
        beta = phase_baseline['beta']
        theta = phase_baseline['theta']
        
        # Process recent events with decay
        recent_events = behavior_modifiers.get('recentEvents', [])
        current_time = behavior_modifiers.get('currentTime', 0)
        
        if not current_time:
            # Use latest event timestamp as reference
            current_time = max((e.get('timestamp', 0) for e in recent_events), default=0) + 100
        
        for event in recent_events:
            event_type = event.get('type', '')
            event_timestamp = event.get('timestamp', 0)
            event_intensity = event.get('intensity', 1.0)
            
            modulation = EVENT_MODULATION.get(event_type)
            if not modulation:
                continue
            
            # Calculate time since event
            age_ms = current_time - event_timestamp
            if age_ms < 0:
                age_ms = 0
            
            # Skip events past 3x their duration
            if age_ms > modulation['duration'] * 3:
                continue
            
            # Calculate exponential decay
            decay = math.exp(-DECAY_CONSTANT * age_ms)
            effective_intensity = event_intensity * decay
            
            # Apply modulation (convert multiplier to deviation, apply intensity, convert back)
            alpha *= 1 + (modulation['alpha'] - 1) * effective_intensity
            beta *= 1 + (modulation['beta'] - 1) * effective_intensity
            theta *= 1 + (modulation['theta'] - 1) * effective_intensity
        
        return {'alpha': alpha, 'beta': beta, 'theta': theta}
    
    def _adjust_load_for_phase(self, base_load: float, 
                                behavior_modifiers: Optional[Dict]) -> float:
        """Adjust cognitive load based on current phase baseline."""
        if not behavior_modifiers:
            return base_load
        
        current_phase = behavior_modifiers.get('currentPhase', 'idle')
        phase_baseline = PHASE_BASELINES.get(current_phase, PHASE_BASELINES['idle'])
        
        # Blend base load with phase baseline
        phase_base = phase_baseline.get('baseLoad', 50)
        phase_progress = behavior_modifiers.get('phaseProgress', 0.5)
        
        # Early in phase: closer to phase baseline, late: closer to computed load
        blend_factor = 0.3 + 0.4 * phase_progress  # 0.3 to 0.7
        effective_load = base_load * blend_factor + phase_base * (1 - blend_factor)
        
        return max(0, min(100, effective_load))
    
    def _apply_timeline_modulation(self, timeline: np.ndarray,
                                    modifiers: Dict[str, float],
                                    behavior_modifiers: Optional[Dict]) -> np.ndarray:
        """Apply behavior modulation to cognitive load timeline."""
        if not behavior_modifiers:
            return timeline
        
        # Calculate overall arousal factor (higher beta+theta = higher arousal)
        arousal = (modifiers['beta'] + modifiers['theta']) / 2
        relaxation = modifiers['alpha']
        
        # Modulate timeline based on arousal/relaxation balance
        load_modifier = (arousal / relaxation)
        
        # Apply with smoothing
        modulated = timeline * load_modifier
        
        # Clip to valid range
        return np.clip(modulated, 0, 100)
    
    def _apply_band_modulation(self, brainwaves: Dict[str, np.ndarray],
                                modifiers: Dict[str, float]) -> Dict[str, np.ndarray]:
        """Apply behavior modifiers to brainwave patterns."""
        return {
            'theta': brainwaves['theta'] * modifiers['theta'],
            'alpha': brainwaves['alpha'] * modifiers['alpha'],
            'beta': brainwaves['beta'] * modifiers['beta']
        }


# Singleton instance
_generator: Optional[ChronosEEGGenerator] = None


def get_generator() -> ChronosEEGGenerator:
    """Get or create singleton generator instance."""
    global _generator
    if _generator is None:
        _generator = ChronosEEGGenerator(lazy_load=True)
    return _generator
