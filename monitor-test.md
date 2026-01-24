# 🧪 End-to-End Testing Monitor

## Service Status
✅ **Python Service** (Port 8000) - Running
✅ **Backend Server** (Port 3001) - Running  
✅ **Frontend** (Port 5173) - Running

---

## 📊 What to Watch For During Testing

### **Terminal 1: Python Service (uvicorn)**
```
Expected Flow:
1. INFO:     127.0.0.1:XXXXX - "POST /classify HTTP/1.1" 200 OK
2. JSON logs with: event_count, classifying_interaction_batch, classification_complete
3. Check: category (low/moderate/high), score (0-100), confidence (0.0-1.0)

⚠️ Watch for:
- 400 "insufficient_events" (if < 2 events) - EXPECTED for first batch
- 500 errors - CRITICAL BUG
- Slow response (> 2 seconds) - PERFORMANCE ISSUE
```

### **Terminal 2: Backend Server (node)**
```
Expected Flow:
1. ========================================
2. [BEHAVIORAL] 📊 ANALYZING BATCH #<timestamp>
3. [BEHAVIORAL] Session ID: <UUID>
4. [BEHAVIORAL] Event Count: 10
5. [BEHAVIORAL] Event Types: mousemove, click, scroll, ...
6. [BEHAVIORAL] ✅ Session validated successfully
7. [BEHAVIORAL] 🚀 Forwarding to Python service
8. [BEHAVIORAL] 🎯 Python service responded in XXms
9. [BEHAVIORAL] 💾 ✅ PREDICTION STORED SUCCESSFULLY
10. ========================================

⚠️ Watch for:
- "Session not found" - means using temporary session (login page)
- "Insufficient events" - means < 2 events in batch
- 502 errors - Python service down or timeout
- Missing "STORED SUCCESSFULLY" - Database issue
```

### **Terminal 3: Frontend (esbuild)**
```
Expected:
- Hot reload messages when code changes
- No compilation errors

⚠️ Watch for:
- Build errors (red text)
- TypeScript errors
```

---

## 🎯 Testing Checklist

### **Phase 1: Signup & Authentication**
- [ ] Signup with new email
- [ ] Check backend: Look for `[SIGNUP]` logs
- [ ] Verify: No 401 errors
- [ ] Browser console: `localStorage.getItem('token')` returns JWT

### **Phase 2: Research Phase (Generate Interactions)**
- [ ] Select platform (ChatGPT/Google)
- [ ] Choose topic
- [ ] Generate 15-20 interactions (scroll, click, type)
- [ ] Backend: See batches sent every 10 events
- [ ] Python: See classification responses
- [ ] Backend: See "PREDICTION STORED SUCCESSFULLY"

### **Phase 3: Assessment Phase**
- [ ] Answer 5 questions
- [ ] Check timing (should be fast)

### **Phase 4: Results Page (CRITICAL VALIDATION)**
- [ ] Current Score: Shows correct % (not 0%)
- [ ] Total Clicks: Shows aggregated count (not 1)
- [ ] Behavioral Cognitive Load: Shows level
- [ ] Classification Confidence: Shows %
- [ ] Behavioral Tracking: All show "Inactive"
- [ ] Browser console: Look for "[BEHAVIORAL] Aggregating X predictions"

---

## 🐛 Common Issues to Watch For

### Issue 1: "Insufficient events" on every batch
**Symptom**: Python returns 400 on all batches
**Cause**: Events not being passed correctly
**Check**: Backend log "Event Count" should be ≥ 2

### Issue 2: No predictions stored
**Symptom**: Backend shows Python response but no "STORED SUCCESSFULLY"
**Cause**: Database insert failing
**Check**: Look for error messages after Python response

### Issue 3: Results page shows 1 click instead of many
**Symptom**: Total Clicks = 1 despite many interactions
**Cause**: Aggregation not working (should be fixed now)
**Check**: Browser console should show "Aggregating X predictions"

### Issue 4: Current Score shows 0%
**Symptom**: Score is 0% after answering questions
**Cause**: Assessment score calculation (should be fixed now)
**Check**: Browser console for assessment responses

---

## 📝 Log Collection Instructions

If you find an issue:
1. **Copy the relevant terminal logs** (last 20-30 lines)
2. **Copy browser console logs** (F12 → Console tab)
3. **Note which step failed**
4. Share with me for analysis

---

## ✅ Success Criteria

**Test passes if:**
1. ✅ No 401/502 errors in any terminal
2. ✅ Backend shows "PREDICTION STORED SUCCESSFULLY" for each batch
3. ✅ Python shows 200 OK responses
4. ✅ Results page shows:
   - Correct assessment score (not 0%)
   - Aggregated click count (not 1)
   - Behavioral tracking shows "Inactive"
   - Confidence score and load level displayed

**Ready to start testing!** 🚀
