"""
ML-based cognitive load classifier wrapper.

Optional fallback classifier that uses a pre-trained machine learning model
when available. Returns None if no model is loaded, allowing the rule-based
classifier to remain primary.

Validates: Requirements 4.4
"""

import logging
import os
from pathlib import Path
from typing import List, Literal, Optional, Tuple

from src.models import BehavioralFeatures


CognitiveLoadLevel = Literal["Low", "Moderate", "High", "Very High"]

logger = logging.getLogger(__name__)


class MLClassifier:
    """
    Optional fallback classifier using a trained ML model.
    
    This classifier wraps a pre-trained scikit-learn model (loaded via joblib)
    and provides predictions when the model file is available. If no model
    is available, all prediction methods return None, allowing the rule-based
    classifier to handle classification.
    
    Attributes:
        model: The loaded scikit-learn model, or None if not available
        model_path: Path to the model file
        is_loaded: Whether a model is currently loaded
    """
    
    # Mapping from model output indices to cognitive load levels
    LEVEL_MAPPING = {
        0: "Low",
        1: "Moderate", 
        2: "High",
        3: "Very High",
    }
    
    # Reverse mapping for label encoding
    LABEL_TO_INDEX = {v: k for k, v in LEVEL_MAPPING.items()}
    
    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize the ML classifier.
        
        Args:
            model_path: Path to the pre-trained model file (joblib format).
                       If None or file doesn't exist, classifier operates in
                       fallback mode (returns None for all predictions).
        """
        self.model = None
        self.model_path = model_path
        self.is_loaded = False
        
        if model_path:
            self._load_model(model_path)
    
    def _load_model(self, model_path: str) -> bool:
        """
        Attempt to load a pre-trained model from file.
        
        Args:
            model_path: Path to the model file
            
        Returns:
            True if model loaded successfully, False otherwise
        """
        try:
            path = Path(model_path)
            if not path.exists():
                logger.info(f"ML model file not found at {model_path}, using rule-based classifier")
                return False
            
            # Import joblib only when needed
            import joblib
            
            self.model = joblib.load(model_path)
            self.is_loaded = True
            logger.info(f"ML model loaded successfully from {model_path}")
            return True
            
        except ImportError:
            logger.warning("joblib not installed, ML classifier unavailable")
            return False
        except Exception as e:
            logger.warning(f"Failed to load ML model from {model_path}: {e}")
            return False
    
    def predict(self, features: BehavioralFeatures) -> Optional[Tuple[CognitiveLoadLevel, float]]:
        """
        Predict cognitive load using the ML model.
        
        Args:
            features: BehavioralFeatures instance with all feature values
            
        Returns:
            Tuple of (cognitive_load_level, confidence) if model is loaded,
            None if no model is available.
            
        Note:
            Returns None when model is not available, signaling that the
            rule-based classifier should be used instead.
        """
        if not self.is_loaded or self.model is None:
            return None
        
        try:
            # Convert features to vector format expected by sklearn
            feature_vector = [features.to_feature_vector()]
            
            # Get prediction
            prediction = self.model.predict(feature_vector)[0]
            
            # Get confidence from predict_proba if available
            confidence = 0.7  # Default confidence
            if hasattr(self.model, 'predict_proba'):
                probabilities = self.model.predict_proba(feature_vector)[0]
                confidence = float(max(probabilities))
            
            # Map prediction to level
            if isinstance(prediction, (int, float)):
                level = self.LEVEL_MAPPING.get(int(prediction), "Moderate")
            else:
                # Handle string predictions
                level = str(prediction) if str(prediction) in self.LABEL_TO_INDEX else "Moderate"
            
            return level, confidence
            
        except Exception as e:
            logger.error(f"ML prediction failed: {e}")
            return None
    
    def predict_batch(
        self, 
        features_list: List[BehavioralFeatures]
    ) -> Optional[List[Tuple[CognitiveLoadLevel, float]]]:
        """
        Batch prediction for multiple sessions.
        
        Args:
            features_list: List of BehavioralFeatures instances
            
        Returns:
            List of (cognitive_load_level, confidence) tuples if model is loaded,
            None if no model is available.
        """
        if not self.is_loaded or self.model is None:
            return None
        
        try:
            # Convert all features to vectors
            feature_vectors = [f.to_feature_vector() for f in features_list]
            
            # Get predictions
            predictions = self.model.predict(feature_vectors)
            
            # Get confidences
            confidences = [0.7] * len(predictions)  # Default
            if hasattr(self.model, 'predict_proba'):
                probabilities = self.model.predict_proba(feature_vectors)
                confidences = [float(max(p)) for p in probabilities]
            
            # Map predictions to levels
            results = []
            for pred, conf in zip(predictions, confidences):
                if isinstance(pred, (int, float)):
                    level = self.LEVEL_MAPPING.get(int(pred), "Moderate")
                else:
                    level = str(pred) if str(pred) in self.LABEL_TO_INDEX else "Moderate"
                results.append((level, conf))
            
            return results
            
        except Exception as e:
            logger.error(f"ML batch prediction failed: {e}")
            return None
    
    def reload_model(self, model_path: Optional[str] = None) -> bool:
        """
        Reload the model from file.
        
        Args:
            model_path: New model path, or None to use existing path
            
        Returns:
            True if model loaded successfully, False otherwise
        """
        path = model_path or self.model_path
        if path:
            self.model_path = path
            return self._load_model(path)
        return False
