"""Configuration module for biosignal service."""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration."""
    
    # Flask settings
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('FLASK_DEBUG', '0') == '1'
    
    # Redis settings
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_TTL = int(os.getenv('CACHE_TTL', '3600'))  # 1 hour default
    
    # Model settings
    CHRONOS_MODEL = os.getenv('CHRONOS_MODEL', 'amazon/chronos-t5-mini')
    USE_GPU = os.getenv('USE_GPU', 'false').lower() == 'true'
    DEVICE = 'cuda' if USE_GPU else 'cpu'
    
    # Data paths
    RAW_DATA_PATH = os.getenv('RAW_DATA_PATH', './raw_data')
    PROCESSED_DATA_PATH = os.getenv('PROCESSED_DATA_PATH', './processed_patterns')
    
    # EEG parameters
    SAMPLING_RATE = 250  # Hz (matches Mendeley dataset)
    NUM_CHANNELS = 8
    CHANNELS = ['Fp1', 'Fp2', 'F7', 'F3', 'FZ', 'F4', 'F8', 'C2']
    
    # Generation parameters
    DEFAULT_NUM_POINTS = 50
    PREDICTION_LENGTH = 250  # 1 second at 250 Hz
    
    # Cognitive load thresholds
    LOAD_THRESHOLDS = {
        'natural': (0, 25),
        'lowlevel': (25, 50),
        'midlevel': (50, 75),
        'highlevel': (75, 100)
    }


config = Config()
