"use server";

import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth-helpers";

export async function getCurrentUser() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      onboarded: true,
      level: true,
      avatarUrl: true,
      bio: true,
      phone: true,
      currentPhase: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) throw new Error("User not found");
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      onboarded: true,
      level: true,
      avatarUrl: true,
      bio: true,
      phone: true,
      currentPhase: true,
      inviteToken: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) throw new Error("User not found");
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function getArtists() {
  const artists = await prisma.user.findMany({
    where: { role: "artist" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      onboarded: true,
      level: true,
      bio: true,
      phone: true,
      currentPhase: true,
      inviteToken: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  });
  return artists.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));
}

export async function getAllUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      onboarded: true,
      level: true,
      phone: true,
      currentPhase: true,
      inviteToken: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  });
  return users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));
}

export async function updateProfile(data: {
  name: string;
  bio?: string;
  phone?: string;
}) {
  const session = await requireAuth();
  await prisma.user.update({
    where: { id: session.id },
    data: { name: data.name, bio: data.bio, phone: data.phone },
  });
}
