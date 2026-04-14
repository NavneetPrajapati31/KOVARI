package logger

import (
	"encoding/json"
	"fmt"
	"os"
	"sync/atomic"
	"time"
)

type LogEntry struct {
	Level      string      `json:"level"`
	Timestamp  string      `json:"timestamp"`
	RequestId  string      `json:"requestId,omitempty"`
	UserId     string      `json:"userId,omitempty"`
	Message    string      `json:"message"`
	Status     int         `json:"status,omitempty"`
	LatencyMs  int64       `json:"latencyMs,omitempty"`
	Error      string      `json:"error,omitempty"`
	Metadata   interface{} `json:"metadata,omitempty"`
}

var (
	requestCount int64
	errorCount   int64
)

func Info(requestId, userId, msg string, status int, latency time.Duration, meta interface{}) {
	write("INFO", requestId, userId, msg, status, latency, "", meta)
}

func Error(requestId, userId, msg string, status int, latency time.Duration, err error, meta interface{}) {
	atomic.AddInt64(&errorCount, 1)
	errStr := ""
	if err != nil {
		errStr = err.Error()
	}
	write("ERROR", requestId, userId, msg, status, latency, errStr, meta)
}

func Fatal(msg string, err error) {
	write("FATAL", "", "", msg, 0, 0, err.Error(), nil)
	os.Exit(1)
}

func IncRequest() {
	atomic.AddInt64(&requestCount, 1)
}

func GetMetrics() map[string]int64 {
	return map[string]int64{
		"request_count": atomic.LoadInt64(&requestCount),
		"error_count":   atomic.LoadInt64(&errorCount),
	}
}

func write(level, reqId, userId, msg string, status int, latency time.Duration, errStr string, meta interface{}) {
	entry := LogEntry{
		Level:     level,
		Timestamp: time.Now().Format(time.RFC3339),
		RequestId: reqId,
		UserId:    userId,
		Message:   msg,
		Status:    status,
		LatencyMs: latency.Milliseconds(),
		Error:     errStr,
		Metadata:  meta,
	}

	b, _ := json.Marshal(entry)
	fmt.Fprintln(os.Stdout, string(b))
}
