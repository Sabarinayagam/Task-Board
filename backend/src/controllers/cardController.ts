import { Request, Response } from 'express';
import { cardService } from '../services/cardService';
import {
  createCardSchema,
  updateCardTitleSchema,
  updateCardStatusSchema,
  reorderSchema,
  idParamSchema,
} from '../validation/cardValidation';
import {
  emitCardCreated,
  emitCardUpdated,
  emitCardDeleted,
  emitCardMoved,
  emitCardsReordered,
} from '../socket';

// Every mutating request carries an `X-Socket-Id` header set by the frontend
// so the server knows which client to exclude when the client wants to skip
// re-applying its own broadcast (handled client-side by comparing ids).
function getOriginSocketId(req: Request): string {
  const header = req.header('X-Socket-Id');
  return typeof header === 'string' ? header : '';
}

export const cardController = {
  async list(_req: Request, res: Response) {
    const cards = await cardService.listCards();
    res.status(200).json({ data: cards });
  },

  async create(req: Request, res: Response) {
    const input = createCardSchema.parse(req.body);
    const card = await cardService.createCard(input);
    emitCardCreated(card, getOriginSocketId(req));
    res.status(201).json({ data: card });
  },

  async rename(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    const { title } = updateCardTitleSchema.parse(req.body);
    const card = await cardService.renameCard(id, title);
    emitCardUpdated(card, getOriginSocketId(req));
    res.status(200).json({ data: card });
  },

  async updateStatus(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    const { status, position } = updateCardStatusSchema.parse(req.body);
    const card = await cardService.moveCard(id, status, position);
    emitCardMoved(card, getOriginSocketId(req));
    res.status(200).json({ data: card });
  },

  async remove(req: Request, res: Response) {
    const { id } = idParamSchema.parse(req.params);
    await cardService.deleteCard(id);
    emitCardDeleted(id, getOriginSocketId(req));
    res.status(204).send();
  },

  async reorder(req: Request, res: Response) {
    const { cards } = reorderSchema.parse(req.body);
    const updated = await cardService.reorderCards(cards);
    emitCardsReordered(updated, getOriginSocketId(req));
    res.status(200).json({ data: updated });
  },
};
