"""
Test script for the /classify endpoint.

Run this script to verify the /classify endpoint works correctly
and returns the expected response format for the backend.

Usage:
    python test_classify_endpoint.py
"""

import json
import time
import httpx
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

# Sample interaction batch matching the InteractionBatch model
sample_batch = {
    "session_id": "test-session-123",
    "participant_id": "test-participant-456",
    "platform": "chatgpt",
    "events": [
        {
            "type": "click",
            "timestamp": int(time.time() * 1000),
            "session_id": "test-session-123",
            "platform": "chatgpt",
            "data": {
                "targetElement": "#submit-button",
                "x": 450,
                "y": 320
            }
        },
        {
            "type": "mousemove",
            "timestamp": int(time.time() * 1000) + 100,
            "session_id": "test-session-123",
            "platform": "chatgpt",
            "data": {
                "x": 460,
                "y": 325,
                "velocity": 150.5
            }
        },
        {
            "type": "scroll",
            "timestamp": int(time.time() * 1000) + 200,
            "session_id": "test-session-123",
            "platform": "chatgpt",
            "data": {
                "direction": "down",
                "velocity": 200.0,
                "position": 350.5
            }
        },
        {
            "type": "keystroke",
            "timestamp": int(time.time() * 1000) + 300,
            "session_id": "test-session-123",
            "platform": "chatgpt",
            "data": {
                "keyDownTime": time.time(),
                "keyUpTime": time.time() + 0.1,
                "interKeyInterval": 0.05
            }
        },
        {
            "type": "navigation",
            "timestamp": int(time.time() * 1000) + 400,
            "session_id": "test-session-123",
            "platform": "chatgpt",
            "data": {
                "fromSection": "question-1",
                "toSection": "question-2",
                "dwellTime": 5.5
            }
        }
    ]
}


def test_health_endpoint() -> bool:
    """Test the /health endpoint."""
    print("\n" + "="*70)
    print("Testing /health endpoint...")
    print("="*70)
    
    try:
        response = httpx.get(f"{BASE_URL}/health", timeout=5)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy":
                print("✅ Health check PASSED")
                return True
            else:
                print("❌ Health check FAILED - unexpected response")
                return False
        else:
            print(f"❌ Health check FAILED - status code {response.status_code}")
            return False
            
    except httpx.ConnectError:
        print("❌ Cannot connect to service - is it running?")
        print(f"   Make sure the service is started at {BASE_URL}")
        return False
    except Exception as e:
        print(f"❌ Health check FAILED - {str(e)}")
        return False


def test_classify_endpoint() -> bool:
    """Test the /classify endpoint with sample data."""
    print("\n" + "="*70)
    print("Testing /classify endpoint...")
    print("="*70)
    
    try:
        response = httpx.post(
            f"{BASE_URL}/classify",
            json=sample_batch,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Validate response format
            required_fields = ["category", "score", "confidence", "features", "method"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print(f"❌ FAILED - Missing fields: {missing_fields}")
                return False
            
            # Validate field types and values
            valid = True
            
            # Check category
            valid_categories = ["low", "moderate", "high", "very-high"]
            if data["category"] not in valid_categories:
                print(f"❌ Invalid category: {data['category']}")
                print(f"   Expected one of: {valid_categories}")
                valid = False
            else:
                print(f"✅ Category: {data['category']}")
            
            # Check score
            if not isinstance(data["score"], (int, float)) or not (0 <= data["score"] <= 100):
                print(f"❌ Invalid score: {data['score']} (expected 0-100)")
                valid = False
            else:
                print(f"✅ Score: {data['score']}")
            
            # Check confidence
            if not isinstance(data["confidence"], (int, float)) or not (0.0 <= data["confidence"] <= 1.0):
                print(f"❌ Invalid confidence: {data['confidence']} (expected 0.0-1.0)")
                valid = False
            else:
                print(f"✅ Confidence: {data['confidence']}")
            
            # Check features
            if not isinstance(data["features"], dict):
                print(f"❌ Features should be a dictionary")
                valid = False
            else:
                print(f"✅ Features: {len(data['features'])} feature values")
            
            # Check method
            valid_methods = ["rule-based", "ml-classifier", "blended"]
            if data["method"] not in valid_methods:
                print(f"❌ Invalid method: {data['method']}")
                print(f"   Expected one of: {valid_methods}")
                valid = False
            else:
                print(f"✅ Method: {data['method']}")
            
            if valid:
                print("\n✅ /classify endpoint test PASSED")
                return True
            else:
                print("\n❌ /classify endpoint test FAILED - validation errors")
                return False
                
        else:
            print(f"Response: {response.text}")
            print(f"❌ FAILED - status code {response.status_code}")
            return False
            
    except httpx.ConnectError:
        print("❌ Cannot connect to service - is it running?")
        print(f"   Make sure the service is started at {BASE_URL}")
        return False
    except Exception as e:
        print(f"❌ Test FAILED - {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_insufficient_events() -> bool:
    """Test that /classify rejects requests with insufficient events."""
    print("\n" + "="*70)
    print("Testing /classify with insufficient events...")
    print("="*70)
    
    insufficient_batch = {
        "session_id": "test-session-insufficient",
        "participant_id": "test-participant-456",
        "platform": "google",
        "events": [
            {
                "type": "click",
                "timestamp": int(time.time() * 1000),
                "session_id": "test-session-insufficient",
                "platform": "google",
                "data": {
                    "targetElement": "#button",
                    "x": 100,
                    "y": 100
                }
            }
        ]
    }
    
    try:
        response = httpx.post(
            f"{BASE_URL}/classify",
            json=insufficient_batch,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 400:
            data = response.json()
            if "insufficient" in data.get("detail", "").lower():
                print("✅ Correctly rejected insufficient events")
                return True
            else:
                print("❌ Expected 'insufficient events' error message")
                return False
        else:
            print(f"❌ Expected status 400, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Test FAILED - {str(e)}")
        return False


def main():
    """Run all tests."""
    print("\n" + "="*70)
    print("BEHAVIORAL SERVICE /classify ENDPOINT TEST SUITE")
    print("="*70)
    print(f"Target URL: {BASE_URL}")
    
    results = {
        "Health Check": test_health_endpoint(),
        "Classify Endpoint": test_classify_endpoint(),
        "Insufficient Events": test_insufficient_events(),
    }
    
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    all_passed = all(results.values())
    
    print("\n" + "="*70)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
        print("="*70)
        print("\nThe /classify endpoint is working correctly and ready for")
        print("integration with the backend server.")
    else:
        print("❌ SOME TESTS FAILED")
        print("="*70)
        print("\nPlease check the errors above and ensure the behavioral")
        print("service is running correctly.")
    print()
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    exit(main())
