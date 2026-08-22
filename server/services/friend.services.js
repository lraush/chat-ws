const prisma = require("../db/prisma");
const { validateDisplayName } = require("../utils/displayName");
const { createDirectRoom, publicRoom } = require("./room.services");

function publicUserBrief(user) {
  if (!user) return null;
  return { id: user.id, name: user.name };
}

function publicFriendship(friendship, currentUserId) {
  const isIncoming = friendship.addresseeId === currentUserId;
  const friend = isIncoming ? friendship.requester : friendship.addressee;
  return {
    id: friendship.id,
    status: friendship.status,
    direction: isIncoming ? "incoming" : "outgoing",
    user: publicUserBrief(friend),
    createdAt: friendship.createdAt,
  };
}

async function searchUsersByName(query, excludeUserId) {
  const parsed = validateDisplayName(String(query ?? "").trim());
  if (parsed.error || parsed.name.length < 2) {
    return { error: "invalid_query" };
  }

  const users = await prisma.user.findMany({
    where: {
      name: { contains: parsed.name },
      NOT: { id: excludeUserId },
    },
    select: { id: true, name: true },
    take: 20,
    orderBy: { name: "asc" },
  });

  return { users };
}

async function findFriendshipBetween(userIdA, userIdB) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userIdA, addresseeId: userIdB },
        { requesterId: userIdB, addresseeId: userIdA },
      ],
    },
    include: {
      requester: { select: { id: true, name: true } },
      addressee: { select: { id: true, name: true } },
    },
  });
}

async function listFriends(currentUserId) {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
    },
    include: {
      requester: { select: { id: true, name: true } },
      addressee: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const friends = friendships.map((f) => {
    const friend =
      f.requesterId === currentUserId ? f.addressee : f.requester;
    return publicUserBrief(friend);
  });

  return { friends };
}

async function listFriendRequests(currentUserId) {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "PENDING",
      OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
    },
    include: {
      requester: { select: { id: true, name: true } },
      addressee: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    requests: friendships.map((f) => publicFriendship(f, currentUserId)),
  };
}

async function sendFriendRequest(currentUserId, { userId, name }) {
  let targetId = String(userId ?? "").trim();

  if (!targetId && name) {
    const parsed = validateDisplayName(String(name).trim());
    if (parsed.error) {
      return { error: "invalid_name" };
    }
    const user = await prisma.user.findUnique({
      where: { name: parsed.name },
      select: { id: true },
    });
    if (!user) {
      return { error: "user_not_found" };
    }
    targetId = user.id;
  }

  if (!targetId) {
    return { error: "invalid_request" };
  }

  if (targetId === currentUserId) {
    return { error: "cannot_add_self" };
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, name: true },
  });
  if (!target) {
    return { error: "user_not_found" };
  }

  const existing = await findFriendshipBetween(currentUserId, targetId);
  if (existing) {
    if (existing.status === "ACCEPTED") {
      return { error: "already_friends" };
    }
    return { error: "request_exists" };
  }

  const friendship = await prisma.friendship.create({
    data: {
      requesterId: currentUserId,
      addresseeId: targetId,
    },
    include: {
      requester: { select: { id: true, name: true } },
      addressee: { select: { id: true, name: true } },
    },
  });

  return { request: publicFriendship(friendship, currentUserId) };
}

async function respondToFriendRequest(currentUserId, friendshipId, action) {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
    include: {
      requester: { select: { id: true, name: true } },
      addressee: { select: { id: true, name: true } },
    },
  });

  if (!friendship) {
    return { error: "not_found" };
  }

  if (friendship.addresseeId !== currentUserId) {
    return { error: "forbidden" };
  }

  if (friendship.status !== "PENDING") {
    return { error: "not_pending" };
  }

  if (action === "decline") {
    await prisma.friendship.delete({ where: { id: friendshipId } });
    return { ok: true };
  }

  if (action !== "accept") {
    return { error: "invalid_action" };
  }

  const updated = await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: "ACCEPTED" },
    include: {
      requester: { select: { id: true, name: true } },
      addressee: { select: { id: true, name: true } },
    },
  });

  return { request: publicFriendship(updated, currentUserId) };
}

async function ensureFriends(currentUserId, friendUserId) {
  const friendship = await findFriendshipBetween(currentUserId, friendUserId);
  if (!friendship || friendship.status !== "ACCEPTED") {
    return { error: "not_friends" };
  }
  return { ok: true };
}

async function getOrCreateDirectRoom(currentUserId, friendUserId) {
  if (friendUserId === currentUserId) {
    return { error: "invalid_request" };
  }

  const friendCheck = await ensureFriends(currentUserId, friendUserId);
  if (friendCheck.error) {
    return friendCheck;
  }

  const friend = await prisma.user.findUnique({
    where: { id: friendUserId },
    select: { id: true, name: true },
  });
  if (!friend) {
    return { error: "user_not_found" };
  }

  const room = await createDirectRoom(currentUserId, friendUserId);
  return {
    room: publicRoom(room),
    friend: publicUserBrief(friend),
  };
}

module.exports = {
  searchUsersByName,
  listFriends,
  listFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  getOrCreateDirectRoom,
  publicFriendship,
};
