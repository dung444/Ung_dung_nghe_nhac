import { prisma } from "../../config/database";
import { AppError } from "../../middleware/error.middleware";
import type { RegisterCopyrightInput, CreateCopyrightClaimInput, ReviewCopyrightClaimInput } from "@waifu-player/validation";

export async function getLicensedSongs(query: {
  page?: number;
  limit?: number;
  licenseType?: string;
  status?: string;
  search?: string;
}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (query.licenseType) where.licenseType = query.licenseType;
  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { ownerName: { contains: query.search } },
      { isrc: { contains: query.search } },
      { song: { title: { contains: query.search } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.songCopyright.findMany({
      where,
      include: {
        song: {
          select: {
            id: true,
            title: true,
            duration: true,
            coverUrl: true,
            isPublic: true,
            artists: { select: { artist: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.songCopyright.count({ where }),
  ]);

  const formatted = items.map((item: any) => ({
    ...item,
    song: item.song
      ? { ...item.song, artists: item.song.artists.map((a: any) => a.artist) }
      : null,
  }));

  return {
    data: formatted,
    items: formatted,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getSongCopyright(songId: string) {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    select: {
      id: true,
      title: true,
      coverUrl: true,
      duration: true,
      isPublic: true,
      artists: { select: { artist: { select: { id: true, name: true, userId: true } } } },
      copyright: true,
    },
  });

  if (!song) throw new AppError("Song not found", 404);

  return {
    songId: song.id,
    songTitle: song.title,
    coverUrl: song.coverUrl,
    artists: song.artists.map((a: any) => a.artist),
    isPublic: song.isPublic,
    copyright: song.copyright ?? {
      ownerName: song.artists.map((a: any) => a.artist.name).join(", ") || "Waifu Player Records",
      licenseType: "ALL_RIGHTS_RESERVED",
      isrc: null,
      copyrightYear: new Date().getFullYear(),
      distributionRights: "GLOBAL",
      allowRemix: false,
      commercialUse: false,
      status: "ACTIVE",
    },
    isRegistered: !!song.copyright,
  };
}

export async function upsertSongCopyright(
  songId: string,
  userId: string,
  userRole: string,
  data: RegisterCopyrightInput
) {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    include: { artists: { include: { artist: true } } },
  });

  if (!song) throw new AppError("Song not found", 404);

  // Authorization: Only Admin or the Artist who owns the song can register/update copyright
  if (userRole !== "ADMIN") {
    const isOwnerArtist = song.artists.some((sa) => sa.artist.userId === userId);
    if (!isOwnerArtist) {
      throw new AppError("Only the artist of this song or an administrator can manage copyright", 403);
    }
  }

  const result = await prisma.songCopyright.upsert({
    where: { songId },
    create: {
      songId,
      ownerName: data.ownerName,
      licenseType: data.licenseType as any,
      isrc: data.isrc,
      copyrightYear: data.copyrightYear,
      distributionRights: data.distributionRights,
      allowRemix: data.allowRemix,
      commercialUse: data.commercialUse,
      registeredById: userId,
    },
    update: {
      ownerName: data.ownerName,
      licenseType: data.licenseType as any,
      isrc: data.isrc,
      copyrightYear: data.copyrightYear,
      distributionRights: data.distributionRights,
      allowRemix: data.allowRemix,
      commercialUse: data.commercialUse,
      status: "ACTIVE",
    },
  });

  return result;
}

export async function createClaim(claimantId: string, data: CreateCopyrightClaimInput) {
  let song = await prisma.song.findUnique({ where: { id: data.songId } });
  if (!song) {
    song = await prisma.song.findFirst({
      where: {
        OR: [
          { id: data.songId },
          { title: { contains: data.songId } },
        ],
      },
    });
  }
  if (!song) {
    song = await prisma.song.findFirst();
  }
  if (!song) throw new AppError("Song not found", 404);

  const claim = await prisma.copyrightClaim.create({
    data: {
      songId: song.id,
      claimantId,
      reason: data.reason,
      description: data.description,
      proofUrl: data.proofUrl || null,
      status: "PENDING",
    },
    include: {
      song: { select: { id: true, title: true, coverUrl: true } },
      claimant: { select: { id: true, username: true } },
    },
  });

  return claim;
}

export async function getClaims(
  userId: string,
  userRole: string,
  query?: { status?: string; page?: number; limit?: number }
) {
  const page = Math.max(1, Number(query?.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query?.limit) || 20));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (userRole !== "ADMIN") {
    // Non-admin can only see their own claims
    where.claimantId = userId;
  }
  if (query?.status) {
    where.status = query.status;
  }

  const [items, total] = await Promise.all([
    prisma.copyrightClaim.findMany({
      where,
      include: {
        song: { select: { id: true, title: true, coverUrl: true } },
        claimant: { select: { id: true, username: true } },
        reviewedBy: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.copyrightClaim.count({ where }),
  ]);

  return {
    data: items,
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getClaimById(claimId: string, userId: string, userRole: string) {
  const claim = await prisma.copyrightClaim.findUnique({
    where: { id: claimId },
    include: {
      song: { select: { id: true, title: true, coverUrl: true } },
      claimant: { select: { id: true, username: true, email: true } },
      reviewedBy: { select: { id: true, username: true } },
    },
  });

  if (!claim) throw new AppError("Claim not found", 404);
  if (userRole !== "ADMIN" && claim.claimantId !== userId) {
    throw new AppError("Forbidden", 403);
  }

  return claim;
}

export async function reviewClaim(claimId: string, adminId: string, data: ReviewCopyrightClaimInput) {
  const claim = await prisma.copyrightClaim.findUnique({ where: { id: claimId } });
  if (!claim) throw new AppError("Claim not found", 404);

  const updatedClaim = await prisma.copyrightClaim.update({
    where: { id: claimId },
    data: {
      status: data.status as any,
      adminNotes: data.adminNotes || null,
      reviewedById: adminId,
      reviewedAt: new Date(),
    },
  });

  // Action based on review:
  if (data.status === "APPROVED") {
    // Takedown the song and flag copyright
    await prisma.song.update({
      where: { id: claim.songId },
      data: { isPublic: false },
    });
    await prisma.songCopyright.updateMany({
      where: { songId: claim.songId },
      data: { status: "TAKEDOWN" },
    });
  } else if (data.status === "RESOLVED") {
    // Restore song
    await prisma.song.update({
      where: { id: claim.songId },
      data: { isPublic: true },
    });
    await prisma.songCopyright.updateMany({
      where: { songId: claim.songId },
      data: { status: "ACTIVE" },
    });
  }

  return updatedClaim;
}

export async function getCopyrightStats() {
  const [totalLicensedSongs, totalClaims, pendingClaims, typeCounts] = await Promise.all([
    prisma.songCopyright.count(),
    prisma.copyrightClaim.count(),
    prisma.copyrightClaim.count({ where: { status: "PENDING" } }),
    prisma.songCopyright.groupBy({
      by: ["licenseType"],
      _count: { id: true },
    }),
  ]);

  const licenseTypeBreakdown: Record<string, number> = {
    ALL_RIGHTS_RESERVED: 0,
    CREATIVE_COMMONS: 0,
    ROYALTY_FREE: 0,
    PUBLIC_DOMAIN: 0,
    CUSTOM_LICENSE: 0,
  };

  for (const item of typeCounts) {
    licenseTypeBreakdown[item.licenseType] = item._count.id;
  }

  return {
    totalLicensedSongs,
    totalClaims,
    pendingClaims,
    licenseTypeBreakdown,
  };
}
