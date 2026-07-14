import { Card as PrismaCard, CardStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { CreateCardInput, ReorderItem } from '../types';

// The repository layer is the only place that talks to Prisma directly.
// Services depend on this abstraction rather than the ORM, which keeps
// business logic testable and swappable.
export const cardRepository = {
  async findAll(): Promise<PrismaCard[]> {
    return prisma.card.findMany({
      orderBy: [{ status: 'asc' }, { position: 'asc' }],
    });
  },

  async findById(id: string): Promise<PrismaCard | null> {
    return prisma.card.findUnique({ where: { id } });
  },

  async getMaxPosition(status: CardStatus): Promise<number> {
    const result = await prisma.card.aggregate({
      where: { status },
      _max: { position: true },
    });
    return result._max.position ?? 0;
  },

  async create(input: CreateCardInput & { position: number }): Promise<PrismaCard> {
    return prisma.card.create({
      data: {
        title: input.title,
        status: input.status ?? 'TODO',
        position: input.position,
      },
    });
  },

  async updateTitle(id: string, title: string): Promise<PrismaCard> {
    return prisma.card.update({
      where: { id },
      data: { title },
    });
  },

  async updateStatus(id: string, status: CardStatus, position: number): Promise<PrismaCard> {
    return prisma.card.update({
      where: { id },
      data: { status, position },
    });
  },

  async delete(id: string): Promise<PrismaCard> {
    return prisma.card.delete({ where: { id } });
  },

  // Applies a batch of position/status updates atomically in a single
  // transaction, so a drag-and-drop reorder can never leave the board in a
  // half-updated state if one write fails.
  async reorderMany(items: ReorderItem[]): Promise<PrismaCard[]> {
    return prisma.$transaction(
      items.map((item) =>
        prisma.card.update({
          where: { id: item.id },
          data: { status: item.status, position: item.position },
        })
      )
    );
  },
};
