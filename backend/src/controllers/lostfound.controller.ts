import { Request, Response, NextFunction } from 'express';
import { LostFoundRepository } from '../repositories/lostfound.repository';
import storageService from '../services/storage.service';
import AuditService from '../audit/audit.service';

export class LostFoundController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, search } = req.query as { status?: any; search?: string };
      const items = await LostFoundRepository.getItems(status, search);
      res.status(200).json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const item = await LostFoundRepository.getItemById(id);

      if (!item || item.isHidden) {
        res.status(404).json({ success: false, message: 'Item not found' });
        return;
      }

      res.status(200).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'Image upload is mandatory for lost & found items' });
        return;
      }

      const userId = req.user?.id;
      const imageUrl = storageService.getFileUrl(req.file.filename);
      const imageKey = req.file.filename;

      const item = await LostFoundRepository.createItem({
        creatorId: userId,
        itemName: req.body.itemName,
        category: req.body.category,
        imageUrl,
        imageKey,
        foundLocation: req.body.foundLocation,
        currentLocation: req.body.currentLocation,
        description: req.body.description,
        itemStatus: req.body.itemStatus || 'FOUND',
      });

      if (userId) {
        await AuditService.log({
          eventType: 'LOST_FOUND_POSTED',
          actorId: userId,
          targetType: 'LOST_FOUND',
          targetId: item.id,
          outcome: 'SUCCESS',
        });
      }

      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const existing = await LostFoundRepository.getItemById(id);

      if (!existing) {
        res.status(404).json({ success: false, message: 'Item not found' });
        return;
      }

      if (existing.creatorId && existing.creatorId !== req.user?.id && req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Not authorized to edit this item' });
        return;
      }

      const updated = await LostFoundRepository.updateItem(id, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const existing = await LostFoundRepository.getItemById(id);

      if (!existing) {
        res.status(404).json({ success: false, message: 'Item not found' });
        return;
      }

      if (existing.creatorId && existing.creatorId !== req.user?.id && req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Not authorized to delete this item' });
        return;
      }

      await storageService.deleteFile(existing.imageKey);
      await LostFoundRepository.deleteItem(id);
      res.status(200).json({ success: true, message: 'Item deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  public static async report(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const reporterId = req.user!.id;

      await LostFoundRepository.reportItem(reporterId, id, reason);
      res.status(200).json({ success: true, message: 'Report submitted to moderators' });
    } catch (err) {
      next(err);
    }
  }
}
