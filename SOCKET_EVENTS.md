# Socket.IO Events Documentation

This document lists all Socket.IO events used in the project, their payloads, and usage notes.

---

## Client-to-Server Events

### join-auction
- **Payload:** `{ productId: string }`
- **Description:** Join a room for a specific auction product.

### place-bid
- **Payload:** `{ productId: string, amount: number, bidder: string }`
- **Description:** Place a bid in an auction. Broadcasts to auction room.

### auction-ended
- **Payload:** `{ productId: string, winner: string, finalBid: number }`
- **Description:** Notify that an auction has ended. Broadcasts to auction room.

### notification:new
- **Payload:** `{ userId: string, message: string }`
- **Description:** Send a notification to a specific user.

### delivery:update
- **Payload:** `{ orderId: string, status: string }`
- **Description:** Send a delivery status update to a user.

### order:status
- **Payload:** `{ orderId: string, status: string, userId: string }`
- **Description:** Send an order status update to a user.

### chat:message
- **Payload:** `{ to: string, from: string, message: string, timestamp: Date }`
- **Description:** Send a chat message to a user or support/admin.

### admin:activity
- **Payload:** `{ userId: string, activity: string, timestamp: Date }`
- **Description:** Report user activity (page view, action) to admin dashboard.

### stock:update
- **Payload:** `{ productId: string, stock: number }`
- **Description:** Notify all users of a product's stock change.

### analytics:request
- **Payload:** `{ type: string, params: object }`
- **Description:** Request real-time analytics data (admin dashboard).

### collab:edit
- **Payload:** `{ resourceId: string, userId: string, changes: object }`
- **Description:** Collaborative editing event for shared resources.

---

## Server-to-Client Events

### bid-update
- **Payload:** `{ productId: string, currentBid: number, bidder: string, timestamp: Date }`
- **Description:** Real-time bid update for an auction room.

### auction-ended
- **Payload:** `{ productId: string, winner: string, finalBid: number }`
- **Description:** Real-time auction end notification for an auction room.

### notification:new
- **Payload:** `{ message: string }`
- **Description:** Real-time notification for a user.

### delivery:update
- **Payload:** `{ orderId: string, status: string }`
- **Description:** Real-time delivery status update for a user.

### order:status
- **Payload:** `{ orderId: string, status: string }`
- **Description:** Real-time order status update for a user.

### chat:message
- **Payload:** `{ from: string, message: string, timestamp: Date }`
- **Description:** Real-time chat message from another user or support.

### admin:activity
- **Payload:** `{ userId: string, activity: string, timestamp: Date }`
- **Description:** Real-time user activity for admin dashboard.

### stock:update
- **Payload:** `{ productId: string, stock: number }`
- **Description:** Real-time product stock update for all users.

### analytics:update
- **Payload:** `{ type: string, data: object }`
- **Description:** Real-time analytics data for admin dashboard.

### collab:edit
- **Payload:** `{ resourceId: string, userId: string, changes: object }`
- **Description:** Collaborative editing update for shared resources.

### delivery:location
- **Payload:** `{ orderId: string, location: { lat: number, lng: number }, timestamp: Date }`
- **Description:** Real-time delivery staff location update for customer.

---

## Notes
- All user-targeted events are sent to a room named after the user's ID.
- Auction events are sent to rooms named `auction-<productId>`.
- Admin events may be sent to a special `admin` room.
- Extend this file as new events are added. 