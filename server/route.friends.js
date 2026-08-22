const express = require("express");
const {
  searchUsersByName,
  listFriends,
  listFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  getOrCreateDirectRoom,
} = require("./services/friend.services");
const { requireAuth } = require("./middleware/auth.middleware");

const router = express.Router();

router.get("/api/users/search", requireAuth, async (req, res) => {
  try {
    const result = await searchUsersByName(req.query.q, req.user.id);
    if (result.error === "invalid_query") {
      res.status(400).json({ error: "invalid_query" });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error("search users error:", err);
    res.status(500).json({ error: "failed to search users" });
  }
});

router.get("/api/friends", requireAuth, async (req, res) => {
  try {
    const [friendsResult, requestsResult] = await Promise.all([
      listFriends(req.user.id),
      listFriendRequests(req.user.id),
    ]);
    res.json({
      friends: friendsResult.friends,
      requests: requestsResult.requests,
    });
  } catch (err) {
    console.error("list friends error:", err);
    res.status(500).json({ error: "failed to load friends" });
  }
});

router.post("/api/friends/request", requireAuth, async (req, res) => {
  try {
    const result = await sendFriendRequest(req.user.id, {
      userId: req.body?.userId,
      name: req.body?.name,
    });

    if (result.error === "invalid_name" || result.error === "invalid_request") {
      res.status(400).json({ error: result.error });
      return;
    }
    if (result.error === "user_not_found") {
      res.status(404).json({ error: result.error });
      return;
    }
    if (
      result.error === "cannot_add_self" ||
      result.error === "already_friends" ||
      result.error === "request_exists"
    ) {
      res.status(409).json({ error: result.error });
      return;
    }

    res.status(201).json(result);
  } catch (err) {
    console.error("friend request error:", err);
    res.status(500).json({ error: "failed to send request" });
  }
});

router.patch("/api/friends/:friendshipId", requireAuth, async (req, res) => {
  try {
    const action = String(req.body?.action ?? "").trim();
    const result = await respondToFriendRequest(
      req.user.id,
      req.params.friendshipId,
      action,
    );

    if (result.error === "not_found") {
      res.status(404).json({ error: result.error });
      return;
    }
    if (result.error === "forbidden" || result.error === "not_pending") {
      res.status(403).json({ error: result.error });
      return;
    }
    if (result.error === "invalid_action") {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json(result);
  } catch (err) {
    console.error("respond friend request error:", err);
    res.status(500).json({ error: "failed to update request" });
  }
});

router.post("/api/dm/:friendUserId", requireAuth, async (req, res) => {
  try {
    const friendUserId = decodeURIComponent(req.params.friendUserId).trim();
    const result = await getOrCreateDirectRoom(req.user.id, friendUserId);

    if (result.error === "not_friends") {
      res.status(403).json({ error: result.error });
      return;
    }
    if (result.error === "user_not_found") {
      res.status(404).json({ error: result.error });
      return;
    }
    if (result.error === "invalid_request") {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json(result);
  } catch (err) {
    console.error("create dm error:", err);
    res.status(500).json({ error: "failed to open chat" });
  }
});

module.exports = router;
