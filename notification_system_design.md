# High Level Architecture
Client (React)
	↓
Express API Layer
	↓
Notification Service
	↓
PostgreSQL + Redis
	↓
Queue Workers
	↓
Email + SSE Delivery

# Stage 1
## Goals
- Provide predictable REST endpoints for listing, reading, acknowledging, and creating notifications.
- Support pagination, filtering, and consistent error responses.
- Enable real-time delivery through a dedicated streaming channel.

## Common headers
Request
- Authorization: Bearer <token>
- X-Request-Id: <uuid>
- X-Correlation-Id: <uuid>
- X-Client-Version: <semver>

Response
- X-Request-Id: <uuid>
- X-RateLimit-Limit: <int>
- X-RateLimit-Remaining: <int>
- Cache-Control: no-store

## Resource schema
Notification
```json
{
	"id": "7c5f4b36-91b7-4a0a-a86a-9d6c7d76eab3",
	"type": "Placement",
	"message": "CSX Corporation hiring",
	"createdAt": "2026-04-22T17:51:18Z",
	"readAt": null,
	"priorityScore": 0.92,
	"source": "placement-office"
}
```

Error response
```json
{
	"error": {
		"code": "NOT_FOUND",
		"message": "Notification not found",
		"requestId": "9c7a8c18-90b1-4d73-9b2c-1b9a29f56c41"
	}
}
```

## Endpoints
### GET /v1/notifications
Query params
- status=unread|read
- type=Event|Result|Placement
- limit=1..50
- cursor=<opaque>

Response
```json
{
	"data": [
		{
			"id": "7c5f4b36-91b7-4a0a-a86a-9d6c7d76eab3",
			"type": "Placement",
			"message": "CSX Corporation hiring",
			"createdAt": "2026-04-22T17:51:18Z",
			"readAt": null,
			"priorityScore": 0.92,
			"source": "placement-office"
		}
	],
	"paging": {
		"nextCursor": "eyJpZCI6IjcuLi4iLCJ0cyI6MTcwMDAwMDB9"
	}
}
```

### GET /v1/notifications/{id}
Response
```json
{
	"data": {
		"id": "7c5f4b36-91b7-4a0a-a86a-9d6c7d76eab3",
		"type": "Placement",
		"message": "CSX Corporation hiring",
		"createdAt": "2026-04-22T17:51:18Z",
		"readAt": null,
		"priorityScore": 0.92,
		"source": "placement-office"
	}
}
```

### PATCH /v1/notifications/{id}
Request
```json
{
	"readAt": "2026-04-22T18:01:00Z"
}
```

### POST /v1/notifications/ack
Marks multiple as read in a single call.
```json
{
	"ids": [
		"7c5f4b36-91b7-4a0a-a86a-9d6c7d76eab3",
		"5b32aa2a-2a2a-4c6f-a1c1-9c0dfe6a0b3b"
	],
	"readAt": "2026-04-22T18:01:00Z"
}
```

### GET /v1/notifications/summary
Response
```json
{
	"data": {
		"unreadCount": 12,
		"byType": {
			"Placement": 3,
			"Result": 7,
			"Event": 2
		}
	}
}
```

### POST /v1/notifications
Admin or system usage. Creates a notification record and targets.
```json
{
	"type": "Event",
	"message": "Tech fest",
	"targets": {
		"all": true
	}
}
```

## Real-time delivery
### GET /v1/notifications/stream (SSE)
Headers
- Authorization: Bearer <token>
- Last-Event-ID: <id>

Events
- event: notification.created
- data: { "id": "...", "type": "Placement", "createdAt": "..." }

SSE is preferred because notifications are server-to-client only and lighter than WebSockets.
WebSocket is a valid alternative if bidirectional messaging is required.

Note: For read operations, PATCH /v1/notifications/{id}/read or { "isRead": true } are acceptable alternatives if stricter REST semantics are desired.

# Stage 2
## DB choice
PostgreSQL is recommended for transactional integrity, relational modeling, indexing, and predictable query plans. It supports partitioning and read replicas for scale.

## Schema (core)
```sql
CREATE TABLE students (
	id BIGSERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE
);

CREATE TABLE notifications (
	id UUID PRIMARY KEY,
	type TEXT NOT NULL CHECK (type IN ('Event', 'Result', 'Placement')),
	message TEXT NOT NULL,
	source TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_targets (
	id BIGSERIAL PRIMARY KEY,
	notification_id UUID NOT NULL REFERENCES notifications (id),
	student_id BIGINT NOT NULL REFERENCES students (id),
	read_at TIMESTAMPTZ,
	delivered_at TIMESTAMPTZ,
	channel TEXT NOT NULL DEFAULT 'in_app',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (notification_id, student_id)
);

CREATE INDEX idx_targets_student_read_created
	ON notification_targets (student_id, read_at, created_at DESC);

CREATE INDEX idx_notifications_type_created
	ON notifications (type, created_at DESC);
```

## Scaling notes
- Partition notification_targets by created_at or by hash(student_id) to spread IO.
- Use read replicas for heavy read endpoints (listing, counts).
- Archive old notifications to cold storage to keep hot tables small.
- Maintain a cached unread count in Redis for summary endpoints.

## Query examples
List unread notifications for a student
```sql
SELECT n.id, n.type, n.message, n.created_at, t.read_at
FROM notification_targets t
JOIN notifications n ON n.id = t.notification_id
WHERE t.student_id = $1 AND t.read_at IS NULL
ORDER BY n.created_at DESC
LIMIT $2;
```

Mark a notification as read
```sql
UPDATE notification_targets
SET read_at = NOW()
WHERE student_id = $1 AND notification_id = $2 AND read_at IS NULL;
```

# Stage 3
## Is the query accurate?
The intent is correct, but it is missing a LIMIT and uses SELECT * which increases IO. It also assumes a denormalized schema that does not match Stage 2.

## Why it is slow
- Missing composite index causes a full scan of a large table.
- Sorting by createdAt without an index triggers a full sort.
- SELECT * reads more columns than required.

## Improvements
Query
```sql
SELECT n.id, n.type, n.message, n.created_at
FROM notification_targets nt
JOIN notifications n ON n.id = nt.notification_id
WHERE nt.student_id = $1 AND nt.read_at IS NULL
ORDER BY n.created_at DESC
LIMIT $2;
```

Index
```sql
CREATE INDEX idx_targets_student_read_created
	ON notification_targets (student_id, read_at, created_at DESC);
```

Expected cost
- Without index: full scan plus sort, close to O(N log N).
- With composite index: index seek then ordered scan, near O(log N + K).

Logging
- Log slow queries over a threshold (for example 200 ms) with correlation IDs for tracing.

## Why indexing every column is not effective
- It inflates storage, slows inserts and updates, and rarely matches real query patterns.
- Indexes should align with filter and sort predicates used by critical queries.

## Query: students with placement notifications in last 7 days
```sql
SELECT DISTINCT nt.student_id
FROM notification_targets nt
JOIN notifications n ON n.id = nt.notification_id
WHERE n.type = 'Placement'
  AND n.created_at >= NOW() - INTERVAL '7 days';
```

# Stage 4
## Suggested solution
- Add Redis caching for list and summary endpoints with short TTL.
- Maintain an unread counter per student to avoid repeated COUNT scans.
- Use cursor-based pagination and fetch only above-the-fold items on page load.
- Prefer push updates (SSE or WebSocket) to reduce polling.
- Use ETag with conditional requests and browser-side caching for read notifications.

## Tradeoffs
- Cache improves latency but introduces eventual consistency and invalidation work.
- Counters speed reads but require careful updates on read/ack operations.
- Push channels reduce load but need state management and reconnect logic.
- Browser caching reduces API traffic but needs careful cache busting for new items.

Logging
- Log cache hit ratio, miss rate, and cache invalidation events.

# Stage 5
## Shortcomings in the current approach
- Single-threaded loop makes a long-running, fragile operation.
- No idempotency or retry handling for partial failures.
- Email and DB writes are tightly coupled, risking inconsistent state.
- No batching or queueing; backpressure is not handled.

## Reliable redesign
- Use an outbox table and a queue to fan out work to workers.
- Persist the notification and its targets in a DB transaction.
- Publish a single queue message per batch for asynchronous delivery.
- Retry transient failures with exponential backoff and a dead-letter queue.
- Use idempotency keys to prevent duplicate delivery during retries.

## Should DB save and email send happen together?
No. The DB write should be authoritative and atomic; email should be async. The outbox pattern guarantees delivery without holding the DB transaction open for external calls.

## Revised pseudocode
```text
function notify_all(student_ids, message):
	logger = base_logger.withContext({ operation: "notify_all" })
	notification_id = db.insert_notification(message)
	db.insert_targets(notification_id, student_ids)
	db.insert_outbox("notify_all", { notification_id })
	logger.info("queued notification fanout", { notificationId: notification_id })
	# Student IDs should be processed in batches to avoid memory spikes
	# and to enable horizontal worker scaling.

worker process_outbox():
	for item in db.fetch_outbox(limit=100):
		queue.publish("notify_fanout", item.payload)
		db.mark_outbox_sent(item.id)

worker process_fanout(notification_id):
	for batch in db.fetch_targets(notification_id, batch_size=500):
		queue.publish("deliver_batch", { notification_id, student_ids: batch })

worker deliver_batch(notification_id, student_ids):
	for student_id in student_ids:
		send_email(student_id, notification_id)  # retry on failure, use idempotency key
		push_to_app(student_id, notification_id)
		db.mark_delivered(notification_id, student_id)
```

Logging
- Log retry counts, DLQ events, and partial batch failures.

# Stage 6
## Priority inbox approach
- Fetch notifications from the protected API.
- Compute score = typeWeight - ageMinutes * decayPerMinute.
- Maintain only the top K using a min-heap to avoid full list sorting.

## Complexity
- Selection: O(N log K)
- Final ordering for output: O(K log K)

## Implementation notes
- Output is written to stage6_output.json and stage6_output.md for screenshots.
- Logging middleware captures fetch status, selection summary, and output paths.
