import { CardStatus } from '@prisma/client';
import { cardRepository } from '../repositories/cardRepository';
import { ApiError } from '../middleware/errorHandler';
import { CreateCardInput, ReorderItem } from '../types';

// Business logic lives here, independent of Express and Prisma specifics.
// Controllers call these functions; these functions call the repository.
export const cardService = {
  async listCards() {
    return cardRepository.findAll();
  },

  async createCard(input: CreateCardInput) {
    const status: CardStatus = (input.status as CardStatus) ?? 'TODO';
    const maxPosition = await cardRepository.getMaxPosition(status);
    return cardRepository.create({
      title: input.title,
      status,
      position: maxPosition + 1,
    });
  },

  async renameCard(id: string, title: string) {
    const existing = await cardRepository.findById(id);
    if (!existing) {
      throw new ApiError(404, `Card ${id} not found`);
    }
    return cardRepository.updateTitle(id, title);
  },

  // Moves a card to a (possibly new) column. If no explicit position is
  // supplied, the card is appended to the end of the destination column.
  async moveCard(id: string, status: CardStatus, position?: number) {
    const existing = await cardRepository.findById(id);
    if (!existing) {
      throw new ApiError(404, `Card ${id} not found`);
    }

    let finalPosition = position;
    if (finalPosition === undefined) {
      const maxPosition = await cardRepository.getMaxPosition(status);
      finalPosition = existing.status === status ? existing.position : maxPosition + 1;
    }

    return cardRepository.updateStatus(id, status, finalPosition);
  },

  async deleteCard(id: string) {
    const existing = await cardRepository.findById(id);
    if (!existing) {
      throw new ApiError(404, `Card ${id} not found`);
    }
    return cardRepository.delete(id);
  },

  async reorderCards(items: ReorderItem[]) {
    return cardRepository.reorderMany(items);
  },
};
