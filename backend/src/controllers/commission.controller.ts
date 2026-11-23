import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { CommissionModel, type ICommission } from '../models/Commission';
import { UserModel } from '../models/User';
import { calculateCommissionQuote } from '../utils/commissionPricing';

export const createCommission = async (req: Request, res: Response) => {
  const body: unknown = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Los datos de la solicitud no son válidos.' });
  }

  const data = body as Record<string, unknown>;
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  if (!title || title.length > 120 || !description || description.length > 2000) {
    return res.status(400).json({ error: 'El título y la descripción son obligatorios.' });
  }

  const quote = calculateCommissionQuote(data.service, data.tier, data.licenses);
  if (!quote) {
    return res.status(400).json({ error: 'El servicio, paquete o licencia seleccionado no es válido.' });
  }

  const clientId = res.locals.userId;
  if (typeof clientId !== 'string' || !Types.ObjectId.isValid(clientId)) {
    return res.status(401).json({ error: 'La sesión no es válida; inicia sesión nuevamente.' });
  }

  const artistId = process.env.ARTIST_USER_ID;
  if (!artistId || !Types.ObjectId.isValid(artistId)) {
    return res.status(503).json({ error: 'El administrador debe configurar ARTIST_USER_ID.' });
  }

  try {
    const artist = await UserModel.findById(artistId).select('_id role');
    if (!artist || !['artist', 'admin'].includes(artist.role)) {
      return res.status(503).json({ error: 'ARTIST_USER_ID debe corresponder a una cuenta con rol artist o admin.' });
    }

    const commission = await CommissionModel.create({
      clientId,
      artistId: artist._id,
      service: quote.service,
      packageTier: quote.packageTier,
      licenses: quote.licenses,
      title,
      description,
      budget: quote.budget,
      status: 'pending'
    });

    return res.status(201).json({
      mensaje: 'Solicitud de comisión enviada.',
      commission: {
        id: commission.id,
        title: commission.title,
        budget: commission.budget,
        status: commission.status,
        requestedAt: commission.requestedAt
      }
    });
  } catch (error) {
    console.error('Error al crear solicitud de comisión:', error);
    return res.status(500).json({ error: 'No se pudo guardar la solicitud de comisión.' });
  }
};

export const getCommissions = async (_req: Request, res: Response) => {
  const userId = res.locals.userId as string;
  const role = res.locals.userRole as 'client' | 'artist' | 'admin';
  const filter = role === 'admin'
    ? {}
    : role === 'artist'
      ? { artistId: userId }
      : { clientId: userId };

  try {
    const commissions = await CommissionModel.find(filter)
      .sort({ requestedAt: -1 })
      .select('-__v')
      .lean();
    return res.status(200).json({ commissions });
  } catch (error) {
    console.error('Error al consultar solicitudes de comisión:', error);
    return res.status(500).json({ error: 'No se pudieron consultar las solicitudes.' });
  }
};

const commissionStatuses: ICommission['status'][] = [
  'pending',
  'accepted',
  'in_progress',
  'completed',
  'rejected'
];

export const updateCommissionStatus = async (req: Request, res: Response) => {
  const body: unknown = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Indica un estado válido para la solicitud.' });
  }

  const status = (body as Record<string, unknown>).status;
  if (typeof status !== 'string' || !commissionStatuses.includes(status as ICommission['status'])) {
    return res.status(400).json({ error: 'El estado solicitado no es válido.' });
  }
  const commissionId = req.params.id;
  if (typeof commissionId !== 'string' || !Types.ObjectId.isValid(commissionId)) {
    return res.status(400).json({ error: 'El identificador de comisión no es válido.' });
  }

  const role = res.locals.userRole as 'artist' | 'admin';
  const filter = role === 'admin'
    ? { _id: commissionId }
    : { _id: commissionId, artistId: res.locals.userId };
  const update = status === 'completed'
    ? { $set: { status, completedAt: new Date() } }
    : { $set: { status }, $unset: { completedAt: 1 } };

  try {
    const commission = await CommissionModel.findOneAndUpdate(filter, update, {
      new: true,
      runValidators: true
    }).select('-__v');

    if (!commission) {
      return res.status(404).json({ error: 'No se encontró una comisión asignada a esta cuenta.' });
    }

    return res.status(200).json({
      mensaje: 'Estado de la comisión actualizado.',
      commission
    });
  } catch (error) {
    console.error('Error al actualizar estado de comisión:', error);
    return res.status(500).json({ error: 'No se pudo actualizar la solicitud.' });
  }
};
