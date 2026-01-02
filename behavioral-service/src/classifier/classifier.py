"""
Main cognitive load classifier facade.

Provides a unified interface for cognitive load classification, using the
rule-based classifier as primary and optionally falling back to ML when
a trained model is available.

Validates: Requirements 4.1, 4.2, 4.3, 4.4
"""

import logging
import os
from typing import List, Literal, Optional, Tuple

from src.models import BehavioralFeatures
from .rule_based import RuleBasedClassifier
from .ml_classifier import MLClassifier


CognitiveLoadLevel = Literal["Low", "Moderate", "High", "Very High"]

logger = logging.getLogger(__name__)


class CognitiveLoadClassifier:
    """
    Main classifier that uses rule-based as primary, ML as optional fallback.
    
    This facade provides a unified interface for cognitive load classification.
    The rule-based classifier is always used as the primary method, ensuring
    the system works immediately without any training data.
    
    When a trained ML model is available, it can optionally be used as a
    fallback or for comparison purposes.
    
    Attributes:
        rule_based: The primary rule-based classifier
        ml_classifier: Optional ML classifier (None if no model path provided)
        use_ml_fallback: Whether to use ML as fallback when available
    """
    
    def __init__(
        self, 
        model_path: Optional[str] = None,
        use_ml_fallback: bool = False
    ):
        """
        Initialize the cognitive load classifier.
        
        Args:
            model_path: Optional path to a pre-trained ML model file.
                       If provided and file exists, ML classifier is initialized.
            use_ml_fallback: If True and ML model is available, use ML predictions
                            as fallback. Default is False (rule-based only).
        """
        self.rule_based = RuleBasedClassifier()
        self.ml_classifier = None
        self.use_ml_fallback = use_ml_fallback
        
        if model_path:
            self.ml_classifier = MLClassifier(model_path)
            if self.ml_classifier.is_loaded:
                logger.info("ML classifier initialized as optional fallback")
            else:
                logger.info("ML model not available, using rule-based classifier only")
    
    def predict(self, features: BehavioralFeatures) -> Tuple[CognitiveLoadLevel, float]:
        """
        Classify cognitive load from behavioral features.
        
        Uses the rule-based classifier as the primary method. If use_ml_fallback
        is True and an ML model is loaded, the ML prediction may be used.
        
        Args:
            features: BehavioralFeatures instance with all feature values
            
        Returns:
            Tuple of (cognitive_load_level, confidence) where:
            - cognitive_load_level: "Low", "Moderate", "High", or "Very High"
            - confidence: 0.0 to 1.0 indicating prediction confidence
            
        Validates: Requirements 4.1, 4.2, 4.3
        """
        # Always use rule-based as primary
        level, confidence = self.rule_based.predict(features)
        
        # Optionally use ML as fallback for comparison or override
        if self.use_ml_fallback and self.ml_classifier and self.ml_classifier.is_loaded:
            ml_result = self.ml_classifier.predict(features)
            if ml_result is not None:
                ml_level, ml_confidence = ml_result
                # Use ML result if it has higher confidence
                if ml_confidence > confidence:
                    logger.debug(
                        f"Using ML prediction ({ml_level}, {ml_confidence:.2f}) "
                        f"over rule-based ({level}, {confidence:.2f})"
                    )
                    return ml_level, ml_confidence
        
        return level, confidence
    
    def predict_batch(
        self, 
        features_list: List[BehavioralFeatures]
    ) -> List[Tuple[CognitiveLoadLevel, float]]:
        """
        Batch prediction for multiple sessions.
        
        Args:
            features_list: List of BehavioralFeatures instances
            
        Returns:
            List of (cognitive_load_level, confidence) tuples
        """
        return [self.predict(features) for features in features_list]
    
    def predict_with_details(
        self, 
        features: BehavioralFeatures
    ) -> dict:
        """
        Classify cognitive load with detailed breakdown.
        
        Provides both rule-based and ML predictions (if available) along with
        feature contributions for interpretability.
        
        Args:
            features: BehavioralFeatures instance
            
        Returns:
            Dictionary containing:
            - level: Final cognitive load level
            - confidence: Final confidence score
            - rule_based: Rule-based prediction details
            - ml: ML prediction details (if available)
            - features: Input feature values
        """
        # Get rule-based prediction
        rb_level, rb_confidence = self.rule_based.predict(features)
        
        result = {
            "level": rb_level,
            "confidence": rb_confidence,
            "rule_based": {
                "level": rb_level,
                "confidence": rb_confidence,
            },
            "ml": None,
            "features": features.to_dict(),
        }
        
        # Get ML prediction if available
        if self.ml_classifier and self.ml_classifier.is_loaded:
            ml_result = self.ml_classifier.predict(features)
            if ml_result is not None:
                ml_level, ml_confidence = ml_result
                result["ml"] = {
                    "level": ml_level,
                    "confidence": ml_confidence,
                }
                
                # Update final result if using ML fallback with higher confidence
                if self.use_ml_fallback and ml_confidence > rb_confidence:
                    result["level"] = ml_level
                    result["confidence"] = ml_confidence
        
        return result
    
    @property
    def has_ml_model(self) -> bool:
        """Check if an ML model is loaded and available."""
        return self.ml_classifier is not None and self.ml_classifier.is_loaded
    
    def reload_ml_model(self, model_path: Optional[str] = None) -> bool:
        """
        Reload or load a new ML model.
        
        Args:
            model_path: Path to model file, or None to reload existing
            
        Returns:
            True if model loaded successfully
        """
        if self.ml_classifier is None:
            if model_path:
                self.ml_classifier = MLClassifier(model_path)
                return self.ml_classifier.is_loaded
            return False
        
        return self.ml_classifier.reload_model(model_path)
