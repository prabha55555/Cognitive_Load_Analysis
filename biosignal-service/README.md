# Biosignal Service

Synthetic EEG generation service using Amazon Chronos foundation model and the Mendeley cognitive load EEG dataset.

## Overview

This service generates realistic EEG biosignal visualizations based on cognitive load scores without requiring real-time hardware collection. It uses:

- **Amazon Chronos**: Time series foundation model for pattern generation
- **Mendeley Dataset**: Cognitive Load Assessment Through EEG (15 subjects, 8 channels, 250 Hz)

## Quick Start

### Using Docker (Recommended)

```bash
# From project root
docker-compose up biosignal-service redis
```

### Manual Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment config
cp .env.example .env

# Run development server
python -m src.app
```

## API Endpoints

### Health Check
```
GET /health
```

### Generate Biosignal Data
```
POST /api/biosignal/generate
Content-Type: application/json

{
  "cognitiveLoadScore": 65,
  "participantId": "p123",
  "platform": "chatgpt",
  "numPoints": 50
}
```

### Generate Timeline Only
```
POST /api/biosignal/timeline
Content-Type: application/json

{
  "cognitiveLoadScore": 65,
  "numPoints": 50
}
```

### Generate Brainwaves Only
```
POST /api/biosignal/brainwaves
Content-Type: application/json

{
  "cognitiveLoadScore": 65,
  "numPoints": 50
}
```

### Batch Generation
```
POST /api/biosignal/batch
Content-Type: application/json

{
  "participants": [
    {"id": "p1", "cognitiveLoadScore": 45, "platform": "chatgpt"},
    {"id": "p2", "cognitiveLoadScore": 72, "platform": "google"}
  ]
}
```

## Response Format

```json
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
      "cognitiveLoadScore": 65,
      "loadLevel": "midlevel",
      "participantId": "p123",
      "platform": "chatgpt",
      "generatedAt": "2025-11-29T20:00:00Z"
    }
  }
}
```

## Cognitive Load Mapping

| Score Range | Load Level | Description |
|-------------|------------|-------------|
| 0-25 | natural | Baseline brain activity |
| 25-50 | lowlevel | Simple tasks |
| 50-75 | midlevel | Standard complexity |
| 75-100 | highlevel | Complex tasks |

## Dataset Setup

The service can work in two modes:

### 1. With Mendeley Dataset (Recommended)

1. Download from: https://data.mendeley.com/datasets/kt38js3jv7/1
2. Extract to `data/raw/`
3. Run preprocessing: `python -m src.preprocessing`

### 2. Synthetic Mode (Fallback)

If the dataset is not available, the service automatically generates synthetic reference patterns based on research literature characteristics.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| FLASK_ENV | development | Flask environment |
| REDIS_URL | redis://localhost:6379/0 | Redis connection URL |
| CHRONOS_MODEL | amazon/chronos-t5-large | Chronos model to use |
| USE_GPU | false | Enable GPU acceleration |
| CACHE_TTL | 3600 | Cache TTL in seconds |

## Frequency Band Characteristics

| Band | Frequency | Behavior with High Load |
|------|-----------|------------------------|
| Theta | 4-8 Hz | Increases (working memory) |
| Alpha | 8-13 Hz | Decreases (task engagement) |
| Beta | 13-30 Hz | Increases (concentration) |

## Architecture

```
┌────────────────────────────────────────────┐
│            Flask API Server                │
│  ┌──────────────────────────────────────┐  │
│  │          ChronosEEGGenerator         │  │
│  │   ┌─────────────────────────────┐    │  │
│  │   │    Reference Patterns DB    │    │  │
│  │   │    (Mendeley / Synthetic)   │    │  │
│  │   └─────────────────────────────┘    │  │
│  │   ┌─────────────────────────────┐    │  │
│  │   │   Chronos Foundation Model  │    │  │
│  │   │   (amazon/chronos-t5-large) │    │  │
│  │   └─────────────────────────────┘    │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │         Redis Cache Layer            │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

## Development

### Running Tests

```bash
pytest tests/
```

### Code Style

```bash
# Format code
black src/

# Check types
mypy src/
```

## References

- [Amazon Chronos Paper](https://arxiv.org/abs/2403.07815)
- [Mendeley EEG Dataset](https://data.mendeley.com/datasets/kt38js3jv7/1)
- [Cognitive Load Research](https://www.frontiersin.org/articles/10.3389/fnins.2023.1219133)
