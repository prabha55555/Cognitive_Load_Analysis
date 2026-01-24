-- =============================================================================
-- Cognitive Load Analysis - Demo Data Setup
-- =============================================================================
-- This script clears existing records and inserts realistic demo data
-- for showcasing the research dashboard.
--
-- Run this in Supabase SQL Editor
-- Created: January 24, 2026
-- =============================================================================

-- =============================================================================
-- STEP 1: Clear existing data (in reverse order of foreign key dependencies)
-- =============================================================================

-- First, delete child records
DELETE FROM cognitive_load_metrics;
DELETE FROM creativity_responses;
DELETE FROM assessment_responses;
DELETE FROM interaction_events;
DELETE FROM sessions;
DELETE FROM participants WHERE role = 'participant';  -- Keep admin users

-- =============================================================================
-- STEP 2: Insert 10 realistic participant records
-- =============================================================================

INSERT INTO participants (id, email, name, role, created_at) VALUES
  ('e1be1232-7051-4fdb-8d93-93007e733b37', 'suryaprakash123@gmail.com', 'Suryaprakash', 'participant', '2025-11-02 09:00:00+00'),
  ('a3f2c8d4-9b6e-4a1c-8f5d-2e7b9c4a1f3e', 'saarthymithran456@gmail.com', 'Saarthy Mithran', 'participant', '2025-11-05 14:30:00+00'),
  ('b7d4e5a6-3c2f-4b8e-9d1a-6f3c8b5e2d4a', 'sanjaim789@gmail.com', 'Sanjai M', 'participant', '2025-11-08 11:15:00+00'),
  ('c9a1f3b8-5e4d-4c7a-8b2e-1d6f9a3c5b7e', 'sanjaip321@gmail.com', 'Sanjai P', 'participant', '2025-11-12 16:45:00+00'),
  ('d2b5c7e9-6a3f-4d8b-9c1e-7f4a8b2d5c6e', 'naveenraj654@gmail.com', 'Naveen Raj', 'participant', '2025-11-15 10:00:00+00'),
  ('e8f4a2c6-7b5d-4e9a-8c3f-1b6d9e4a7c2b', 'dharaneesh987@gmail.com', 'Dharaneesh', 'participant', '2025-11-20 13:30:00+00'),
  ('f5c9b3d7-8a6e-4f2b-9d4c-2e7a1f5b8c9d', 'kavinpoovaragavan246@gmail.com', 'Kavin Poovaragavan', 'participant', '2025-11-25 08:45:00+00'),
  ('a6d8e4f2-9c7b-4a5e-8d3f-1c6b9a4e7d2f', 'manibharathi135@gmail.com', 'Manibharathi', 'participant', '2025-12-01 15:00:00+00'),
  ('b1f7c5a9-3e8d-4b6f-9c2a-7d4e1b8f5c3a', 'sourav864@gmail.com', 'Sourav', 'participant', '2025-12-05 09:30:00+00'),
  ('c4a9d6b2-5f1e-4c8a-8d7b-3e9f2c6a5d1b', 'hari579@gmail.com', 'Hari', 'participant', '2025-12-10 12:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STEP 3: Insert research sessions for each participant
-- Each participant has 1-2 completed sessions (alternating between chatgpt and google)
-- =============================================================================

INSERT INTO sessions (id, participant_id, platform, topic, current_phase, start_time, end_time, research_data, created_at) VALUES
  -- Suryaprakash - 2 sessions
  ('f8a3c5d9-6b2e-4f7a-9c1d-8e4b7a2c5f9d', 'e1be1232-7051-4fdb-8d93-93007e733b37', 'chatgpt', 'Impact of Artificial Intelligence on Healthcare Diagnostics', 'completed', '2025-11-02 09:00:00+00', '2025-11-02 09:42:00+00', '{"queries": 8, "notes": 5, "timeSpent": 2520, "creativityScore": 72}', '2025-11-02 09:00:00+00'),
  ('a2d7e9f4-8c3b-4a6e-9d2f-1c5b8e4a7d3f', 'e1be1232-7051-4fdb-8d93-93007e733b37', 'google', 'Machine Learning in Climate Change Prediction', 'completed', '2025-11-10 14:00:00+00', '2025-11-10 14:38:00+00', '{"queries": 12, "notes": 7, "timeSpent": 2280, "creativityScore": 68}', '2025-11-10 14:00:00+00'),
  
  -- Saarthy Mithran - 2 sessions
  ('b5f1c8a6-9e4d-4b7f-8c3a-2d6e9f1b5c8a', 'a3f2c8d4-9b6e-4a1c-8f5d-2e7b9c4a1f3e', 'google', 'Quantum Computing Applications in Cryptography', 'completed', '2025-11-05 14:30:00+00', '2025-11-05 15:15:00+00', '{"queries": 15, "notes": 9, "timeSpent": 2700, "creativityScore": 85}', '2025-11-05 14:30:00+00'),
  ('c7a4d2f9-3b5e-4c8a-9d6f-1e7c4a8b2d5f', 'a3f2c8d4-9b6e-4a1c-8f5d-2e7b9c4a1f3e', 'chatgpt', 'Neural Networks for Natural Language Processing', 'completed', '2025-11-18 10:00:00+00', '2025-11-18 10:48:00+00', '{"queries": 10, "notes": 6, "timeSpent": 2880, "creativityScore": 78}', '2025-11-18 10:00:00+00'),
  
  -- Sanjai M - 1 session
  ('d9e2f7c4-6a8b-4d5e-8c1f-3b7d9e2a6c4f', 'b7d4e5a6-3c2f-4b8e-9d1a-6f3c8b5e2d4a', 'chatgpt', 'Sustainable Energy Storage Technologies', 'completed', '2025-11-08 11:15:00+00', '2025-11-08 11:52:00+00', '{"queries": 7, "notes": 4, "timeSpent": 2220, "creativityScore": 65}', '2025-11-08 11:15:00+00'),
  
  -- Sanjai P - 2 sessions
  ('e3f8a5c2-7d9b-4e6a-8c4f-1b5d8e3a7c2f', 'c9a1f3b8-5e4d-4c7a-8b2e-1d6f9a3c5b7e', 'google', 'Blockchain Technology in Supply Chain Management', 'completed', '2025-11-12 16:45:00+00', '2025-11-12 17:30:00+00', '{"queries": 11, "notes": 8, "timeSpent": 2700, "creativityScore": 71}', '2025-11-12 16:45:00+00'),
  ('f6c1d9a4-8e7b-4f2c-9d5a-3c6e1f8b4d7a', 'c9a1f3b8-5e4d-4c7a-8b2e-1d6f9a3c5b7e', 'chatgpt', 'Ethical Implications of Autonomous Vehicles', 'completed', '2025-11-28 09:00:00+00', '2025-11-28 09:45:00+00', '{"queries": 9, "notes": 5, "timeSpent": 2700, "creativityScore": 74}', '2025-11-28 09:00:00+00'),
  
  -- Naveen Raj - 2 sessions
  ('a8b4e7f2-9c6d-4a3e-8d1f-2b7c9a5e4d8f', 'd2b5c7e9-6a3f-4d8b-9c1e-7f4a8b2d5c6e', 'chatgpt', 'Gene Editing and CRISPR Technology Ethics', 'completed', '2025-11-15 10:00:00+00', '2025-11-15 10:55:00+00', '{"queries": 14, "notes": 10, "timeSpent": 3300, "creativityScore": 88}', '2025-11-15 10:00:00+00'),
  ('b2d9f5c7-3a8e-4b6d-9c4f-1e8a2d7b5c9f', 'd2b5c7e9-6a3f-4d8b-9c1e-7f4a8b2d5c6e', 'google', 'Renewable Energy Grid Integration', 'completed', '2025-12-08 15:00:00+00', '2025-12-08 15:42:00+00', '{"queries": 10, "notes": 6, "timeSpent": 2520, "creativityScore": 76}', '2025-12-08 15:00:00+00'),
  
  -- Dharaneesh - 1 session
  ('c5e3a8d1-6f9b-4c7e-8d2a-3b4f7c1e9d6a', 'e8f4a2c6-7b5d-4e9a-8c3f-1b6d9e4a7c2b', 'google', 'Virtual Reality in Education and Training', 'completed', '2025-11-20 13:30:00+00', '2025-11-20 14:10:00+00', '{"queries": 9, "notes": 5, "timeSpent": 2400, "creativityScore": 62}', '2025-11-20 13:30:00+00'),
  
  -- Kavin Poovaragavan - 2 sessions
  ('d7f4c2a9-8b5e-4d1f-9c6a-2e3d8f7b4c1a', 'f5c9b3d7-8a6e-4f2b-9d4c-2e7a1f5b8c9d', 'chatgpt', 'Microplastics Impact on Marine Ecosystems', 'completed', '2025-11-25 08:45:00+00', '2025-11-25 09:28:00+00', '{"queries": 8, "notes": 6, "timeSpent": 2580, "creativityScore": 70}', '2025-11-25 08:45:00+00'),
  ('e9a6d4f1-7c8b-4e3a-8d5f-1c9e4a6b2d7f', 'f5c9b3d7-8a6e-4f2b-9d4c-2e7a1f5b8c9d', 'google', 'Urban Planning for Smart Cities', 'completed', '2025-12-12 11:00:00+00', '2025-12-12 11:48:00+00', '{"queries": 13, "notes": 8, "timeSpent": 2880, "creativityScore": 79}', '2025-12-12 11:00:00+00'),
  
  -- Manibharathi - 2 sessions
  ('f2c8e5a3-9d6b-4f7c-8a1e-3b5f9c2d8a4e', 'a6d8e4f2-9c7b-4a5e-8d3f-1c6b9a4e7d2f', 'google', 'Cybersecurity in Internet of Things Devices', 'completed', '2025-12-01 15:00:00+00', '2025-12-01 15:52:00+00', '{"queries": 11, "notes": 7, "timeSpent": 3120, "creativityScore": 73}', '2025-12-01 15:00:00+00'),
  ('a4d1f7c9-3e8b-4a5d-9c2f-1b6e8a3d7c5f', 'a6d8e4f2-9c7b-4a5e-8d3f-1c6b9a4e7d2f', 'chatgpt', 'Space Debris Mitigation Strategies', 'completed', '2025-12-15 10:30:00+00', '2025-12-15 11:18:00+00', '{"queries": 10, "notes": 8, "timeSpent": 2880, "creativityScore": 82}', '2025-12-15 10:30:00+00'),
  
  -- Sourav - 1 session
  ('b6e9a3d7-5c2f-4b8e-8d4a-2f7c1b9e6a4d', 'b1f7c5a9-3e8d-4b6f-9c2a-7d4e1b8f5c3a', 'chatgpt', 'Mental Health Impact of Social Media', 'completed', '2025-12-05 09:30:00+00', '2025-12-05 10:15:00+00', '{"queries": 12, "notes": 9, "timeSpent": 2700, "creativityScore": 77}', '2025-12-05 09:30:00+00'),
  
  -- Hari - 2 sessions
  ('c8f2d5a1-7e9b-4c6f-9d3a-1b4e7c8f2d5a', 'c4a9d6b2-5f1e-4c8a-8d7b-3e9f2c6a5d1b', 'google', 'Personalized Medicine and Genomics', 'completed', '2025-12-10 12:00:00+00', '2025-12-10 12:48:00+00', '{"queries": 14, "notes": 10, "timeSpent": 2880, "creativityScore": 84}', '2025-12-10 12:00:00+00'),
  ('d1a7e4f9-8c3b-4d2a-8e6f-3c5d9a1e7b4f', 'c4a9d6b2-5f1e-4c8a-8d7b-3e9f2c6a5d1b', 'chatgpt', 'Augmented Reality in Surgical Procedures', 'completed', '2025-12-18 14:00:00+00', '2025-12-18 14:45:00+00', '{"queries": 9, "notes": 6, "timeSpent": 2700, "creativityScore": 75}', '2025-12-18 14:00:00+00');

-- =============================================================================
-- STEP 4: Insert cognitive load metrics for each session
-- Mix of low, moderate, high cognitive load to show variety
-- =============================================================================

INSERT INTO cognitive_load_metrics (id, session_id, overall_score, category, assessment_score, behavioral_score, blended_score, source, created_at) VALUES
  -- Session 1 - Moderate load
  (gen_random_uuid(), 'f8a3c5d9-6b2e-4f7a-9c1d-8e4b7a2c5f9d', 52, 'moderate', 55, 48, 52, 'blended', '2025-11-02 09:42:00+00'),
  -- Session 2 - High load
  (gen_random_uuid(), 'a2d7e9f4-8c3b-4a6e-9d2f-1c5b8e4a7d3f', 68, 'high', 72, 64, 68, 'blended', '2025-11-10 14:38:00+00'),
  -- Session 3 - High load
  (gen_random_uuid(), 'b5f1c8a6-9e4d-4b7f-8c3a-2d6e9f1b5c8a', 71, 'high', 75, 67, 71, 'blended', '2025-11-05 15:15:00+00'),
  -- Session 4 - Moderate load
  (gen_random_uuid(), 'c7a4d2f9-3b5e-4c8a-9d6f-1e7c4a8b2d5f', 58, 'moderate', 60, 55, 58, 'blended', '2025-11-18 10:48:00+00'),
  -- Session 5 - Low load
  (gen_random_uuid(), 'd9e2f7c4-6a8b-4d5e-8c1f-3b7d9e2a6c4f', 35, 'low', 38, 32, 35, 'blended', '2025-11-08 11:52:00+00'),
  -- Session 6 - Moderate load
  (gen_random_uuid(), 'e3f8a5c2-7d9b-4e6a-8c4f-1b5d8e3a7c2f', 48, 'moderate', 52, 44, 48, 'blended', '2025-11-12 17:30:00+00'),
  -- Session 7 - High load
  (gen_random_uuid(), 'f6c1d9a4-8e7b-4f2c-9d5a-3c6e1f8b4d7a', 65, 'high', 68, 62, 65, 'blended', '2025-11-28 09:45:00+00'),
  -- Session 8 - Very High load
  (gen_random_uuid(), 'a8b4e7f2-9c6d-4a3e-8d1f-2b7c9a5e4d8f', 78, 'very-high', 82, 74, 78, 'blended', '2025-11-15 10:55:00+00'),
  -- Session 9 - Moderate load
  (gen_random_uuid(), 'b2d9f5c7-3a8e-4b6d-9c4f-1e8a2d7b5c9f', 55, 'moderate', 58, 52, 55, 'blended', '2025-12-08 15:42:00+00'),
  -- Session 10 - Low load
  (gen_random_uuid(), 'c5e3a8d1-6f9b-4c7e-8d2a-3b4f7c1e9d6a', 32, 'low', 35, 29, 32, 'blended', '2025-11-20 14:10:00+00'),
  -- Session 11 - Moderate load
  (gen_random_uuid(), 'd7f4c2a9-8b5e-4d1f-9c6a-2e3d8f7b4c1a', 45, 'moderate', 48, 42, 45, 'blended', '2025-11-25 09:28:00+00'),
  -- Session 12 - High load
  (gen_random_uuid(), 'e9a6d4f1-7c8b-4e3a-8d5f-1c9e4a6b2d7f', 62, 'high', 65, 59, 62, 'blended', '2025-12-12 11:48:00+00'),
  -- Session 13 - Very High load
  (gen_random_uuid(), 'f2c8e5a3-9d6b-4f7c-8a1e-3b5f9c2d8a4e', 76, 'very-high', 80, 72, 76, 'blended', '2025-12-01 15:52:00+00'),
  -- Session 14 - Moderate load
  (gen_random_uuid(), 'a4d1f7c9-3e8b-4a5d-9c2f-1b6e8a3d7c5f', 54, 'moderate', 56, 52, 54, 'blended', '2025-12-15 11:18:00+00'),
  -- Session 15 - High load
  (gen_random_uuid(), 'b6e9a3d7-5c2f-4b8e-8d4a-2f7c1b9e6a4d', 63, 'high', 66, 60, 63, 'blended', '2025-12-05 10:15:00+00'),
  -- Session 16 - Very High load
  (gen_random_uuid(), 'c8f2d5a1-7e9b-4c6f-9d3a-1b4e7c8f2d5a', 79, 'very-high', 82, 76, 79, 'blended', '2025-12-10 12:48:00+00'),
  -- Session 17 - Moderate load
  (gen_random_uuid(), 'd1a7e4f9-8c3b-4d2a-8e6f-3c5d9a1e7b4f', 51, 'moderate', 54, 48, 51, 'blended', '2025-12-18 14:45:00+00');

-- =============================================================================
-- STEP 5: Insert assessment responses for each session (5 questions each)
-- =============================================================================

-- Session 1 assessment responses
INSERT INTO assessment_responses (session_id, question_id, question_text, difficulty, answer_index, is_correct, score, earned_points, start_time, end_time, confidence_level) VALUES
  ('f8a3c5d9-6b2e-4f7a-9c1d-8e4b7a2c5f9d', 'q1', 'What is the primary advantage of AI in healthcare diagnostics?', 'easy', 1, true, 10, 10, '2025-11-02 09:25:00+00', '2025-11-02 09:26:30+00', 4),
  ('f8a3c5d9-6b2e-4f7a-9c1d-8e4b7a2c5f9d', 'q2', 'Which ML technique is most used in medical imaging?', 'medium', 2, true, 20, 20, '2025-11-02 09:26:30+00', '2025-11-02 09:28:15+00', 3),
  ('f8a3c5d9-6b2e-4f7a-9c1d-8e4b7a2c5f9d', 'q3', 'What is a major ethical concern with AI diagnostics?', 'medium', 0, true, 20, 20, '2025-11-02 09:28:15+00', '2025-11-02 09:30:00+00', 4),
  ('f8a3c5d9-6b2e-4f7a-9c1d-8e4b7a2c5f9d', 'q4', 'How does deep learning improve diagnostic accuracy?', 'hard', 3, false, 30, 0, '2025-11-02 09:30:00+00', '2025-11-02 09:33:00+00', 2),
  ('f8a3c5d9-6b2e-4f7a-9c1d-8e4b7a2c5f9d', 'q5', 'What regulatory framework governs AI medical devices?', 'hard', 1, true, 30, 30, '2025-11-02 09:33:00+00', '2025-11-02 09:36:00+00', 3);

-- Session 3 assessment responses (higher cognitive load)
INSERT INTO assessment_responses (session_id, question_id, question_text, difficulty, answer_index, is_correct, score, earned_points, start_time, end_time, confidence_level) VALUES
  ('b5f1c8a6-9e4d-4b7f-8c3a-2d6e9f1b5c8a', 'q1', 'What is quantum superposition?', 'medium', 2, true, 20, 20, '2025-11-05 14:50:00+00', '2025-11-05 14:52:30+00', 3),
  ('b5f1c8a6-9e4d-4b7f-8c3a-2d6e9f1b5c8a', 'q2', 'How does quantum computing threaten current cryptography?', 'hard', 1, true, 30, 30, '2025-11-05 14:52:30+00', '2025-11-05 14:56:00+00', 4),
  ('b5f1c8a6-9e4d-4b7f-8c3a-2d6e9f1b5c8a', 'q3', 'What is Shors algorithm used for?', 'hard', 0, true, 30, 30, '2025-11-05 14:56:00+00', '2025-11-05 15:00:00+00', 4),
  ('b5f1c8a6-9e4d-4b7f-8c3a-2d6e9f1b5c8a', 'q4', 'Define quantum entanglement in cryptographic context', 'hard', 2, false, 30, 0, '2025-11-05 15:00:00+00', '2025-11-05 15:05:00+00', 2),
  ('b5f1c8a6-9e4d-4b7f-8c3a-2d6e9f1b5c8a', 'q5', 'What is post-quantum cryptography?', 'medium', 3, true, 20, 20, '2025-11-05 15:05:00+00', '2025-11-05 15:08:00+00', 4);

-- Session 8 assessment responses (very high cognitive load)
INSERT INTO assessment_responses (session_id, question_id, question_text, difficulty, answer_index, is_correct, score, earned_points, start_time, end_time, confidence_level) VALUES
  ('a8b4e7f2-9c6d-4a3e-8d1f-2b7c9a5e4d8f', 'q1', 'What is CRISPR-Cas9?', 'easy', 1, true, 10, 10, '2025-11-15 10:30:00+00', '2025-11-15 10:31:30+00', 5),
  ('a8b4e7f2-9c6d-4a3e-8d1f-2b7c9a5e4d8f', 'q2', 'What are the ethical concerns of germline editing?', 'hard', 0, true, 30, 30, '2025-11-15 10:31:30+00', '2025-11-15 10:36:00+00', 3),
  ('a8b4e7f2-9c6d-4a3e-8d1f-2b7c9a5e4d8f', 'q3', 'Explain off-target effects in gene editing', 'hard', 2, false, 30, 0, '2025-11-15 10:36:00+00', '2025-11-15 10:42:00+00', 2),
  ('a8b4e7f2-9c6d-4a3e-8d1f-2b7c9a5e4d8f', 'q4', 'What regulatory bodies oversee gene therapy?', 'medium', 3, true, 20, 20, '2025-11-15 10:42:00+00', '2025-11-15 10:45:00+00', 4),
  ('a8b4e7f2-9c6d-4a3e-8d1f-2b7c9a5e4d8f', 'q5', 'What is the difference between somatic and germline editing?', 'hard', 1, true, 30, 30, '2025-11-15 10:45:00+00', '2025-11-15 10:50:00+00', 3);

-- =============================================================================
-- STEP 6: Insert creativity responses for selected sessions
-- =============================================================================

INSERT INTO creativity_responses (session_id, question_id, question_text, response_text, overall_score, relevance_score, creativity_score, depth_score, coherence_score, time_efficiency_score, ai_feedback, timestamp, time_taken) VALUES
  ('f8a3c5d9-6b2e-4f7a-9c1d-8e4b7a2c5f9d', 'c1', 'Propose an innovative application of AI in healthcare that addresses a current gap', 'I envision an AI system that integrates wearable sensor data with electronic health records to provide predictive health alerts. This system would use federated learning to maintain patient privacy while analyzing patterns across populations. The AI could detect early signs of chronic conditions like diabetes or heart disease months before traditional screening methods.', 72, 85, 75, 68, 80, 70, 'Creative integration of multiple technologies with good practical application. Could explore implementation challenges more deeply.', '2025-11-02 09:38:00+00', 180),
  
  ('b5f1c8a6-9e4d-4b7f-8c3a-2d6e9f1b5c8a', 'c1', 'Design a quantum-safe encryption method for future communication systems', 'I propose a hybrid encryption system that combines lattice-based cryptography with traditional methods during the transition period. The system would automatically upgrade security protocols based on quantum computing advancement metrics. This approach ensures backward compatibility while preparing for quantum threats.', 85, 90, 88, 82, 85, 80, 'Excellent forward-thinking solution with practical transition considerations. Strong technical understanding demonstrated.', '2025-11-05 15:10:00+00', 240),
  
  ('a8b4e7f2-9c6d-4a3e-8d1f-2b7c9a5e4d8f', 'c1', 'Develop an ethical framework for gene editing in human embryos', 'My framework consists of three pillars: medical necessity, informed consent across generations, and reversibility requirements. Before any germline modification, a international panel of ethicists, geneticists, and patient advocates must approve. All modifications should have documented reversal procedures when possible.', 88, 92, 85, 90, 88, 82, 'Comprehensive ethical framework with multi-stakeholder consideration. The reversibility concept is particularly innovative.', '2025-11-15 10:52:00+00', 300),
  
  ('c5e3a8d1-6f9b-4c7e-8d2a-3b4f7c1e9d6a', 'c1', 'Create an immersive VR learning experience for medical students', 'I propose a VR surgery simulator where students can practice procedures in a risk-free environment. The system uses haptic feedback gloves for realistic touch sensation and AI-driven patient scenarios that respond to student decisions. Performance analytics track improvement over time.', 62, 70, 58, 65, 72, 55, 'Good foundational idea but could be more innovative. Haptic feedback is expected; consider novel interaction methods.', '2025-11-20 14:05:00+00', 150),
  
  ('c8f2d5a1-7e9b-4c6f-9d3a-1b4e7c8f2d5a', 'c1', 'Design a personalized medicine delivery system using genomic data', 'I envision a smart medication system that adjusts drug dosages in real-time based on continuous genomic and metabolic monitoring. Using microfluidic patches that analyze biomarkers, the system would modify drug release rates to maintain optimal therapeutic levels. Machine learning would predict medication interactions and suggest alternatives.', 84, 88, 82, 85, 80, 78, 'Innovative integration of genomics with drug delivery. The real-time adjustment concept is forward-thinking. Consider regulatory pathway.', '2025-12-10 12:45:00+00', 270);

-- =============================================================================
-- STEP 7: Insert interaction events for behavioral tracking (sample events)
-- =============================================================================

-- Insert sample interaction events for a few sessions to show behavioral data
INSERT INTO interaction_events (session_id, type, timestamp, platform, data) VALUES
  -- Session 1 interactions
  ('f8a3c5d9-6b2e-4f7a-9c1d-8e4b7a2c5f9d', 'click', '2025-11-02 09:05:00+00', 'chatgpt', '{"element": "send_button", "x": 520, "y": 680}'),
  ('f8a3c5d9-6b2e-4f7a-9c1d-8e4b7a2c5f9d', 'keystroke', '2025-11-02 09:06:00+00', 'chatgpt', '{"keyCount": 45, "duration": 8000}'),
  ('f8a3c5d9-6b2e-4f7a-9c1d-8e4b7a2c5f9d', 'scroll', '2025-11-02 09:08:00+00', 'chatgpt', '{"direction": "down", "distance": 300}'),
  ('f8a3c5d9-6b2e-4f7a-9c1d-8e4b7a2c5f9d', 'click', '2025-11-02 09:10:00+00', 'chatgpt', '{"element": "send_button", "x": 520, "y": 680}'),
  ('f8a3c5d9-6b2e-4f7a-9c1d-8e4b7a2c5f9d', 'keystroke', '2025-11-02 09:12:00+00', 'chatgpt', '{"keyCount": 62, "duration": 12000}'),
  
  -- Session 3 interactions (higher volume - more cognitive engagement)
  ('b5f1c8a6-9e4d-4b7f-8c3a-2d6e9f1b5c8a', 'search', '2025-11-05 14:32:00+00', 'google', '{"query": "quantum computing cryptography basics"}'),
  ('b5f1c8a6-9e4d-4b7f-8c3a-2d6e9f1b5c8a', 'click', '2025-11-05 14:33:00+00', 'google', '{"element": "search_result", "position": 1}'),
  ('b5f1c8a6-9e4d-4b7f-8c3a-2d6e9f1b5c8a', 'scroll', '2025-11-05 14:35:00+00', 'google', '{"direction": "down", "distance": 800}'),
  ('b5f1c8a6-9e4d-4b7f-8c3a-2d6e9f1b5c8a', 'navigation', '2025-11-05 14:37:00+00', 'google', '{"from": "article1", "to": "article2"}'),
  ('b5f1c8a6-9e4d-4b7f-8c3a-2d6e9f1b5c8a', 'search', '2025-11-05 14:40:00+00', 'google', '{"query": "Shors algorithm explained"}'),
  ('b5f1c8a6-9e4d-4b7f-8c3a-2d6e9f1b5c8a', 'click', '2025-11-05 14:41:00+00', 'google', '{"element": "search_result", "position": 2}'),
  ('b5f1c8a6-9e4d-4b7f-8c3a-2d6e9f1b5c8a', 'scroll', '2025-11-05 14:44:00+00', 'google', '{"direction": "down", "distance": 1200}'),
  ('b5f1c8a6-9e4d-4b7f-8c3a-2d6e9f1b5c8a', 'input', '2025-11-05 14:46:00+00', 'google', '{"type": "note", "length": 150}'),
  
  -- Session 8 interactions (very high engagement)
  ('a8b4e7f2-9c6d-4a3e-8d1f-2b7c9a5e4d8f', 'click', '2025-11-15 10:02:00+00', 'chatgpt', '{"element": "send_button", "x": 520, "y": 680}'),
  ('a8b4e7f2-9c6d-4a3e-8d1f-2b7c9a5e4d8f', 'keystroke', '2025-11-15 10:05:00+00', 'chatgpt', '{"keyCount": 120, "duration": 25000}'),
  ('a8b4e7f2-9c6d-4a3e-8d1f-2b7c9a5e4d8f', 'scroll', '2025-11-15 10:10:00+00', 'chatgpt', '{"direction": "down", "distance": 600}'),
  ('a8b4e7f2-9c6d-4a3e-8d1f-2b7c9a5e4d8f', 'click', '2025-11-15 10:12:00+00', 'chatgpt', '{"element": "send_button", "x": 520, "y": 680}'),
  ('a8b4e7f2-9c6d-4a3e-8d1f-2b7c9a5e4d8f', 'keystroke', '2025-11-15 10:15:00+00', 'chatgpt', '{"keyCount": 85, "duration": 18000}'),
  ('a8b4e7f2-9c6d-4a3e-8d1f-2b7c9a5e4d8f', 'scroll', '2025-11-15 10:20:00+00', 'chatgpt', '{"direction": "up", "distance": 200}'),
  ('a8b4e7f2-9c6d-4a3e-8d1f-2b7c9a5e4d8f', 'click', '2025-11-15 10:22:00+00', 'chatgpt', '{"element": "copy_button", "x": 600, "y": 400}'),
  ('a8b4e7f2-9c6d-4a3e-8d1f-2b7c9a5e4d8f', 'input', '2025-11-15 10:25:00+00', 'chatgpt', '{"type": "note", "length": 280}');

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify participant count
SELECT 'Participants' as table_name, COUNT(*) as count FROM participants WHERE role = 'participant';

-- Verify session count
SELECT 'Sessions' as table_name, COUNT(*) as count FROM sessions;

-- Verify cognitive load metrics
SELECT 'Cognitive Load Metrics' as table_name, COUNT(*) as count FROM cognitive_load_metrics;

-- Verify platform distribution
SELECT platform, COUNT(*) as session_count FROM sessions GROUP BY platform;

-- Verify cognitive load distribution
SELECT category, COUNT(*) as count FROM cognitive_load_metrics GROUP BY category ORDER BY count DESC;

-- =============================================================================
-- DEMO DATA SETUP COMPLETE
-- =============================================================================
-- Summary:
-- - 10 participants with realistic names and emails
-- - 17 completed research sessions (Nov-Dec 2025)
-- - Mix of ChatGPT (8) and Google (9) platform usage
-- - Cognitive load metrics for all sessions
-- - Sample assessment responses
-- - Sample creativity responses
-- - Sample interaction events for behavioral tracking
-- =============================================================================
