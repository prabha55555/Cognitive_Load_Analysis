"""
Rule-based cognitive load classifier.

Primary classifier using scientifically-grounded heuristic rules based on
behavioral thresholds from HCI research.

Classification is based on behavioral indicators:
- Response time patterns (slower = higher load)
- Rage clicks (frustration indicator)
- Mouse trajectory deviation (confusion indicator)
- Navigation revisits (difficulty finding information)
- Idle time (processing/thinking time)
- Active time ratio (engagement level)

Validates: Requirements 4.1, 4.2, 4.3
"""

from typing import Literal, Tuple

from src.models import BehavioralFeatures


CognitiveLoadLevel = Literal["Low", "Moderate", "High", "Very High"]


class RuleBasedClassifier:
    """
    Primary classifier using scientifically-grounded heuristic rules.
    
    Classification is based on weighted scoring across behavioral dimensions.
    Each feature contributes a score based on predefined thresholds, and the
    final cognitive load level is determined by the aggregate score.
    
    Thresholds are based on HCI research literature on cognitive load indicators.
    """
    
    # Feature thresholds for each cognitive load level
    # Format: (low_threshold, moderate_threshold, high_threshold)
    # Values below low_threshold = Low load
    # Values between low and moderate = Moderate load
    # Values between moderate and high = High load
    # Values above high = Very High load
    
    THRESHOLDS = {
        "mean_response_time": (1.5, 3.0, 5.0),      # seconds
        "rage_click_count": (0, 1, 3),               # count
        "trajectory_deviation": (0.2, 0.4, 0.6),    # normalized 0-1
        "revisit_ratio": (0.1, 0.25, 0.4),          # ratio 0-1
        "total_idle_time": (10.0, 30.0, 60.0),      # seconds
    }
    
    # Active time ratio uses inverted thresholds (higher = lower load)
    ACTIVE_TIME_THRESHOLDS = (0.8, 0.6, 0.4)  # (low, moderate, high)
    
    # Weights for each feature in the final score
    WEIGHTS = {
        "mean_response_time": 1.5,
        "rage_click_count": 2.0,
        "trajectory_deviation": 1.2,
        "revisit_ratio": 1.0,
        "total_idle_time": 0.8,
        "active_time_ratio": 1.0,
    }
    
    def __init__(self):
        """Initialize the rule-based classifier."""
        pass
    
    def _score_feature(
        self, 
        value: float, 
        thresholds: Tuple[float, float, float],
        inverted: bool = False
    ) -> int:
        """
        Score a single feature based on thresholds.
        
        Args:
            value: The feature value to score
            thresholds: Tuple of (low, moderate, high) thresholds
            inverted: If True, higher values indicate lower load
            
        Returns:
            Score from 0 (Low) to 3 (Very High)
        """
        low, moderate, high = thresholds
        
        if inverted:
            # Higher values = lower load
            if value >= low:
                return 0  # Low load
            elif value >= moderate:
                return 1  # Moderate load
            elif value >= high:
                return 2  # High load
            else:
                return 3  # Very High load
        else:
            # Higher values = higher load
            if value < low:
                return 0  # Low load
            elif value < moderate:
                return 1  # Moderate load
            elif value < high:
                return 2  # High load
            else:
                return 3  # Very High load
    
    def _calculate_weighted_score(self, features: BehavioralFeatures) -> float:
        """
        Calculate weighted aggregate score from all features.
        
        Args:
            features: BehavioralFeatures instance
            
        Returns:
            Weighted score (0-3 range, can exceed slightly due to weighting)
        """
        total_weight = 0.0
        weighted_sum = 0.0
        
        # Score standard features
        for feature_name, thresholds in self.THRESHOLDS.items():
            value = getattr(features, feature_name)
            score = self._score_feature(value, thresholds)
            weight = self.WEIGHTS[feature_name]
            weighted_sum += score * weight
            total_weight += weight
        
        # Score active time ratio (inverted)
        active_score = self._score_feature(
            features.active_time_ratio, 
            self.ACTIVE_TIME_THRESHOLDS, 
            inverted=True
        )
        weight = self.WEIGHTS["active_time_ratio"]
        weighted_sum += active_score * weight
        total_weight += weight
        
        return weighted_sum / total_weight if total_weight > 0 else 0.0
    
    def _score_to_level(self, score: float) -> CognitiveLoadLevel:
        """
        Convert numeric score to cognitive load level.
        
        Args:
            score: Weighted score (0-3 range)
            
        Returns:
            Cognitive load level string
        """
        if score < 0.75:
            return "Low"
        elif score < 1.5:
            return "Moderate"
        elif score < 2.25:
            return "High"
        else:
            return "Very High"
    
    def _calculate_confidence(self, features: BehavioralFeatures, level: CognitiveLoadLevel) -> float:
        """
        Calculate confidence score based on feature agreement.
        
        Higher confidence when multiple features point to the same level.
        
        Args:
            features: BehavioralFeatures instance
            level: The predicted cognitive load level
            
        Returns:
            Confidence score between 0.0 and 1.0
        """
        level_to_score = {"Low": 0, "Moderate": 1, "High": 2, "Very High": 3}
        target_score = level_to_score[level]
        
        # Collect individual feature scores
        feature_scores = []
        
        for feature_name, thresholds in self.THRESHOLDS.items():
            value = getattr(features, feature_name)
            score = self._score_feature(value, thresholds)
            feature_scores.append(score)
        
        # Add active time ratio score
        active_score = self._score_feature(
            features.active_time_ratio,
            self.ACTIVE_TIME_THRESHOLDS,
            inverted=True
        )
        feature_scores.append(active_score)
        
        # Calculate agreement: how many features agree with the final level
        # Agreement is measured by distance from target score
        total_distance = sum(abs(s - target_score) for s in feature_scores)
        max_possible_distance = len(feature_scores) * 3  # Max distance is 3 per feature
        
        # Convert distance to confidence (less distance = higher confidence)
        agreement_ratio = 1.0 - (total_distance / max_possible_distance)
        
        # Scale confidence to reasonable range (0.5 - 1.0)
        # Even with disagreement, we have some confidence in rule-based approach
        confidence = 0.5 + (agreement_ratio * 0.5)
        
        return round(confidence, 3)
    
    def predict(self, features: BehavioralFeatures) -> Tuple[CognitiveLoadLevel, float]:
        """
        Classify cognitive load using weighted feature thresholds.
        
        Args:
            features: BehavioralFeatures instance with all feature values
            
        Returns:
            Tuple of (cognitive_load_level, confidence) where:
            - cognitive_load_level: "Low", "Moderate", "High", or "Very High"
            - confidence: 0.0 to 1.0 based on how clearly features indicate the level
            
        Validates: Requirements 4.1, 4.2
        """
        # Calculate weighted score
        weighted_score = self._calculate_weighted_score(features)
        
        # Convert to level
        level = self._score_to_level(weighted_score)
        
        # Calculate confidence
        confidence = self._calculate_confidence(features, level)
        
        return level, confidence
