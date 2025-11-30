# Changes Log

## November 29-30, 2025 - Synthetic EEG Generation System Implementation

### Overview
Implemented a complete synthetic EEG generation system using Amazon Chronos foundation model trained on the Mendeley cognitive load EEG dataset, enabling real-time brainwave visualization without hardware requirements.

---

### 🆕 New Files Created

#### Biosignal Service (Python Microservice)
| Timestamp | File | Description |
|-----------|------|-------------|
| Nov 29, 2025 | `biosignal-service/Dockerfile` | Docker container for Python Flask service |
| Nov 29, 2025 | `biosignal-service/requirements.txt` | Python dependencies (Flask, PyTorch, Chronos, scipy, redis) |
| Nov 29, 2025 | `biosignal-service/src/__init__.py` | Package initializer |
| Nov 29, 2025 | `biosignal-service/src/app.py` | Flask API server with Redis caching |
| Nov 29, 2025 | `biosignal-service/src/config.py` | Service configuration settings |
| Nov 29, 2025 | `biosignal-service/src/generator.py` | Chronos-based EEG signal generator |
| Nov 29, 2025 | `biosignal-service/src/preprocessing.py` | Mendeley dataset preprocessing utilities |

#### Docker Configuration
| Timestamp | File | Description |
|-----------|------|-------------|
| Nov 29, 2025 | `docker-compose.yml` | Multi-service orchestration (Redis, Biosignal, Backend) |
| Nov 29, 2025 | `Dockerfile.frontend` | Frontend container configuration |

#### Frontend Services
| Timestamp | File | Description |
|-----------|------|-------------|
| Nov 29, 2025 | `src/services/biosignalService.ts` | Frontend API client for biosignal endpoints |

#### Backend Routes
| Timestamp | File | Description |
|-----------|------|-------------|
| Nov 29, 2025 | `server/src/routes/biosignal.ts` | Express proxy routes to Python service |

---

### 📝 Modified Files

#### Backend Server
| Timestamp | File | Changes |
|-----------|------|---------|
| Nov 29, 2025 | `server/src/index.ts` | Added biosignal routes, Redis client, proxy middleware |
| Nov 29, 2025 | `server/package.json` | Added redis, http-proxy-middleware dependencies |

#### Frontend Components
| Timestamp | File | Changes |
|-----------|------|---------|
| Nov 29, 2025 | `src/hooks/useEEGStream.ts` | Updated to fetch from biosignal API with fallback data |
| Nov 29, 2025 | `src/components/ParticipantDashboard.tsx` | Integrated biosignal service with cognitive load score |

#### Configuration
| Timestamp | File | Changes |
|-----------|------|---------|
| Nov 30, 2025 | `.gitignore` | Added `raw_data/`, `biosignal-service/processed_patterns/`, `*.pkl` |
| Nov 30, 2025 | `README.md` | Updated with biosignal service docs, Docker instructions, new tech stack |

---

### 🐛 Bug Fixes

| Timestamp | Issue | Resolution |
|-----------|-------|------------|
| Nov 29, 2025 | Docker health checks failing | Changed from `curl` to `wget` (biosignal) and `node` http module (backend) |
| Nov 29, 2025 | Import errors in `server/src/index.ts` | Created stub routers for placeholder routes |
| Nov 29, 2025 | Flask cache decorator error | Fixed to handle Flask tuple responses `(response, status_code)` |
| Nov 29, 2025 | EEG file parsing errors | Updated `load_eeg_file()` to extract columns 1-8 as EEG channels, skip timestamps |
| Nov 29, 2025 | Mendeley data format mismatch | Rewrote parser to handle comma-separated format with timestamp suffix |

---

### 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│  Node.js API    │────▶│  Python Flask   │
│  (React/Vite)   │     │   (Port 3001)   │     │   (Port 5000)   │
│   Port 5173     │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └────────┬────────┘
                                 │                       │
                                 ▼                       ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │     Redis       │     │ Amazon Chronos  │
                        │   (Port 6379)   │     │  T5-Large Model │
                        └─────────────────┘     └─────────────────┘
```

---

### 📊 EEG Generation Pipeline

1. **Data Source**: Mendeley Cognitive Load EEG Dataset
   - 15 subjects, 8 channels (OpenBCI), 250 Hz sampling
   - 4 cognitive load levels: natural, lowlevel, midlevel, highlevel
   - Tasks: Arithmetic, Stroop

2. **Preprocessing** (`preprocessing.py`):
   - Parse raw .txt files extracting EEG channels (columns 1-8)
   - Extract frequency bands (theta, alpha, beta, gamma)
   - Create reference patterns per load level

3. **Generation** (`generator.py`):
   - Select seed pattern based on cognitive load score
   - Use Chronos T5-Large for time-series forecasting
   - Generate theta, alpha, beta brainwave patterns
   - Calculate cognitive load timeline

4. **API Response**:
   ```json
   {
     "success": true,
     "data": {
       "brainwavePatterns": {
         "theta": [...],
         "alpha": [...],
         "beta": [...]
       },
       "cognitiveLoadTimeline": [...],
       "metadata": {
         "channels": ["Fp1","Fp2","F7","F3","FZ","F4","F8","C2"],
         "samplingRate": 250,
         "loadLevel": "midlevel"
       }
     }
   }
   ```

---

### 🚀 Running the System

```bash
# Start all services
docker-compose up -d

# Verify services are healthy
docker-compose ps

# Start frontend
npm run dev

# Test biosignal API directly
curl -X POST http://localhost:5000/api/biosignal/generate \
  -H "Content-Type: application/json" \
  -d '{"cognitiveLoadScore": 65, "participantId": "test"}'
```

---

### 📦 Dependencies Added

#### Python (biosignal-service)
- `flask==3.0.0`
- `torch>=2.0.0`
- `chronos-forecasting`
- `scipy>=1.11.0`
- `redis>=5.0.0`
- `gunicorn>=21.0.0`

#### Node.js (server)
- `redis@^4.6.0`
- `http-proxy-middleware@^2.0.0`

---

### 📁 Data Requirements

The Mendeley EEG dataset must be placed in `raw_data/` with structure:
```
raw_data/
├── Arithmetic_Data/
│   ├── natural-1.txt ... natural-15.txt
│   ├── lowlevel-1.txt ... lowlevel-15.txt
│   ├── midlevel-1.txt ... midlevel-15.txt
│   └── highlevel-1.txt ... highlevel-15.txt
└── Stroop_Data/
    └── (same structure)
```

Dataset source: https://data.mendeley.com/datasets/kt38js3jv7/1
