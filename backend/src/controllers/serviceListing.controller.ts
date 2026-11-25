import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ServiceListingModel } from '../models/ServiceListing';
import { validateServiceListingInput } from '../utils/serviceListingValidation';

export const listPublicServices = async (_req: Request, res: Response) => {
  try {
    const services = await ServiceListingModel.find({ active: true })
      .sort({ displayOrder: 1, title: 1 })
      .select('-__v')
      .lean();
    return res.status(200).json({ services });
  } catch (error) {
    console.error('Error al consultar los servicios:', error);
    return res.status(500).json({ error: 'No se pudieron cargar los servicios.' });
  }
};

export const getPublicService = async (req: Request, res: Response) => {
  const slug = typeof req.params.slug === 'string' ? req.params.slug.trim().toLowerCase() : '';
  try {
    const service = await ServiceListingModel.findOne({ slug, active: true }).select('-__v').lean();
    if (!service) return res.status(404).json({ error: 'No se encontró el servicio solicitado.' });
    return res.status(200).json({ service });
  } catch (error) {
    console.error('Error al consultar el servicio:', error);
    return res.status(500).json({ error: 'No se pudo cargar el servicio.' });
  }
};

export const listManageableServices = async (_req: Request, res: Response) => {
  try {
    const services = await ServiceListingModel.find()
      .sort({ displayOrder: 1, title: 1 })
      .select('-__v')
      .lean();
    return res.status(200).json({ services });
  } catch (error) {
    console.error('Error al consultar los servicios editables:', error);
    return res.status(500).json({ error: 'No se pudieron cargar los servicios editables.' });
  }
};

export const createService = async (req: Request, res: Response) => {
  const validation = validateServiceListingInput(req.body, true);
  if ('error' in validation) return res.status(400).json({ error: validation.error });

  try {
    const service = await ServiceListingModel.create(validation.value);
    return res.status(201).json({ mensaje: 'Servicio creado.', service });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ error: 'Ya existe un servicio con ese identificador.' });
    }
    console.error('Error al crear el servicio:', error);
    return res.status(500).json({ error: 'No se pudo guardar el servicio.' });
  }
};

export const updateService = async (req: Request, res: Response) => {
  const serviceId = req.params.id;
  if (typeof serviceId !== 'string' || !Types.ObjectId.isValid(serviceId)) {
    return res.status(400).json({ error: 'El identificador del servicio no es válido.' });
  }

  const validation = validateServiceListingInput(req.body, false);
  if ('error' in validation) return res.status(400).json({ error: validation.error });

  try {
    const service = await ServiceListingModel.findByIdAndUpdate(serviceId, validation.value, {
      new: true,
      runValidators: true
    }).select('-__v');
    if (!service) return res.status(404).json({ error: 'No se encontró el servicio.' });
    return res.status(200).json({ mensaje: 'Servicio actualizado.', service });
  } catch (error) {
    console.error('Error al actualizar el servicio:', error);
    return res.status(500).json({ error: 'No se pudo actualizar el servicio.' });
  }
};

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === 11000
  );
}
