import { v } from "convex/values";
import { authedMutation, authedQuery, optionalAuthQuery } from "./lib/customFunctions";

export const listMembers = optionalAuthQuery({
  args: { pageId: v.id("pages") },
  returns: v.any(),
  handler: async (ctx, args) => {
    if (!ctx.user) return null;
    const page = await ctx.db.get(args.pageId);
    if (!page) return null;

    const ownerUser = await ctx.db.get(page.ownerId);

    const memberRows = await ctx.db
      .query("page_members")
      .withIndex("by_page", (q) => q.eq("page_id", args.pageId))
      .collect();

    let userRole: "owner" | "admin" | "editor" | null = null;
    if (page.ownerId === ctx.user._id) {
      userRole = "owner";
    } else {
      const myMembership = memberRows.find((m) => m.user_id === ctx.user._id);
      if (myMembership) {
        userRole = myMembership.role;
      }
    }

    const members = [];

    // Owner is always present
    if (ownerUser) {
      members.push({
        id: `owner-${ownerUser._id}`,
        user_id: ownerUser._id,
        name: ownerUser.name || "Page Owner",
        username: ownerUser.username || "",
        email: ownerUser.email,
        image: ownerUser.profile_image,
        role: "owner" as const,
        joined_at: page._creationTime,
        is_owner: true,
      });
    }

    // Hydrate all invited members
    for (const m of memberRows) {
      if (m.user_id === page.ownerId) continue;
      const u = await ctx.db.get(m.user_id);
      if (u) {
        members.push({
          id: m._id,
          user_id: u._id,
          name: u.name || "Teammate",
          username: u.username || "",
          email: u.email,
          image: u.profile_image,
          role: m.role,
          joined_at: m.added_at,
          is_owner: false,
        });
      }
    }

    // Number of invited teammates (excluding the owner)
    const invitedCount = members.filter((m) => !m.is_owner).length;

    return {
      page: {
        id: page._id,
        name: page.name,
        ownerId: page.ownerId,
      },
      members,
      invitedCount,
      userRole,
      canManage: userRole === "owner" || userRole === "admin",
    };
  },
});

export const searchUsers = authedQuery({
  args: {
    query: v.string(),
    pageId: v.optional(v.id("pages")),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const q = args.query.trim().toLowerCase();
    if (!q) return [];

    const existingUserIds = new Set<string>();
    if (args.pageId) {
      const page = await ctx.db.get(args.pageId);
      if (page) {
        existingUserIds.add(page.ownerId);
      }
      const existingMembers = await ctx.db
        .query("page_members")
        .withIndex("by_page", (idx) => idx.eq("page_id", args.pageId!))
        .collect();
      for (const m of existingMembers) {
        existingUserIds.add(m.user_id);
      }
    }

    const allUsers = await ctx.db.query("users").take(150);
    const matches = allUsers
      .filter((u) => {
        if (existingUserIds.has(u._id)) return false;
        const nameMatch = u.name?.toLowerCase().includes(q);
        const usernameMatch = u.username?.toLowerCase().includes(q);
        const emailMatch = u.email?.toLowerCase().includes(q);
        return Boolean(nameMatch || usernameMatch || emailMatch);
      })
      .slice(0, 10)
      .map((u) => ({
        id: u._id,
        name: u.name || "Unnamed User",
        username: u.username || "",
        email: u.email,
        image: u.profile_image,
        headline: u.headline || u.account_type || "",
      }));

    return matches;
  },
});

export const addMember = authedMutation({
  args: {
    pageId: v.id("pages"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("editor")),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Page not found");

    // Check permission: caller must be owner or admin
    const isOwner = page.ownerId === ctx.user._id;
    const adminMembership = await ctx.db
      .query("page_members")
      .withIndex("by_page_and_user", (q) =>
        q.eq("page_id", args.pageId).eq("user_id", ctx.user._id)
      )
      .first();

    if (!isOwner && adminMembership?.role !== "admin") {
      throw new Error("You do not have permission to invite team members");
    }

    if (args.userId === page.ownerId) {
      throw new Error("User is already the page owner");
    }

    const existing = await ctx.db
      .query("page_members")
      .withIndex("by_page_and_user", (q) =>
        q.eq("page_id", args.pageId).eq("user_id", args.userId)
      )
      .first();

    if (existing) {
      throw new Error("User is already a team member");
    }

    const memberId = await ctx.db.insert("page_members", {
      page_id: args.pageId,
      user_id: args.userId,
      role: args.role,
      added_at: Date.now(),
      added_by: ctx.user._id,
    });

    return { success: true, memberId };
  },
});

export const updateRole = authedMutation({
  args: {
    pageId: v.id("pages"),
    memberId: v.id("page_members"),
    role: v.union(v.literal("admin"), v.literal("editor")),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Page not found");

    const isOwner = page.ownerId === ctx.user._id;
    const adminMembership = await ctx.db
      .query("page_members")
      .withIndex("by_page_and_user", (q) =>
        q.eq("page_id", args.pageId).eq("user_id", ctx.user._id)
      )
      .first();

    if (!isOwner && adminMembership?.role !== "admin") {
      throw new Error("You do not have permission to change roles");
    }

    const member = await ctx.db.get(args.memberId);
    if (!member || member.page_id !== args.pageId) {
      throw new Error("Member not found");
    }

    await ctx.db.patch(args.memberId, { role: args.role });
    return { success: true };
  },
});

export const removeMember = authedMutation({
  args: {
    pageId: v.id("pages"),
    memberId: v.id("page_members"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Page not found");

    const isOwner = page.ownerId === ctx.user._id;
    const adminMembership = await ctx.db
      .query("page_members")
      .withIndex("by_page_and_user", (q) =>
        q.eq("page_id", args.pageId).eq("user_id", ctx.user._id)
      )
      .first();

    if (!isOwner && adminMembership?.role !== "admin") {
      throw new Error("You do not have permission to remove team members");
    }

    const member = await ctx.db.get(args.memberId);
    if (!member || member.page_id !== args.pageId) {
      throw new Error("Member not found");
    }

    await ctx.db.delete(args.memberId);
    return { success: true };
  },
});

export const transferOwnership = authedMutation({
  args: {
    pageId: v.id("pages"),
    newOwnerUserId: v.id("users"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Page not found");

    if (page.ownerId !== ctx.user._id) {
      throw new Error("Only the current page owner can transfer ownership");
    }

    if (args.newOwnerUserId === ctx.user._id) {
      throw new Error("You are already the owner");
    }

    const newOwner = await ctx.db.get(args.newOwnerUserId);
    if (!newOwner) throw new Error("Target user not found");

    // If new owner is already in page_members, remove them from page_members
    const existing = await ctx.db
      .query("page_members")
      .withIndex("by_page_and_user", (q) =>
        q.eq("page_id", args.pageId).eq("user_id", args.newOwnerUserId)
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Add previous owner as admin in page_members
    await ctx.db.insert("page_members", {
      page_id: args.pageId,
      user_id: ctx.user._id,
      role: "admin",
      added_at: Date.now(),
      added_by: ctx.user._id,
    });

    // Transfer ownerId on page
    await ctx.db.patch(args.pageId, { ownerId: args.newOwnerUserId });

    return { success: true };
  },
});
