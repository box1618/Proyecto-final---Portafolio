export interface ServicePackageInput {
  name: string;
  description: string;
  price: number;
  deliveryDays: number;
  included: string;
}

export interface ServiceListingInput {
  slug?: string;
  category: string;
  title: string;
  description: string;
  rules: string[];
  images: string[];
  packages: ServicePackageInput[];
  active: boolean;
  displayOrder: number;
}

export type ServiceListingValidation =
  | { value: ServiceListingInput }
  | { error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function validImageUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (/^\/images\/[a-zA-Z0-9._/-]+$/.test(value)) return true;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateServiceListingInput(
  body: unknown,
  requireSlug: boolean
): ServiceListingValidation {
  if (!isRecord(body)) return { error: 'Los datos del servicio no son válidos.' };

  const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : undefined;
  if (requireSlug && (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 60)) {
    return { error: 'El identificador solo puede contener letras minúsculas, números y guiones.' };
  }

  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (!category || category.length > 60 || !title || title.length > 120 || !description || description.length > 2000) {
    return { error: 'La categoría, el título y la descripción son obligatorios y deben respetar sus límites.' };
  }

  if (!Array.isArray(body.rules) || body.rules.length > 20 ||
      !body.rules.every((rule) => typeof rule === 'string' && rule.trim().length > 0 && rule.trim().length <= 300)) {
    return { error: 'Las reglas deben ser una lista de hasta 20 textos de máximo 300 caracteres.' };
  }
  if (!Array.isArray(body.images) || body.images.length > 6 || !body.images.every(validImageUrl)) {
    return { error: 'Las imágenes deben ser hasta 6 URLs HTTPS válidas.' };
  }
  if (!Array.isArray(body.packages) || body.packages.length < 1 || body.packages.length > 5) {
    return { error: 'Agrega entre 1 y 5 paquetes al servicio.' };
  }

  const packages: ServicePackageInput[] = [];
  for (const rawPackage of body.packages) {
    if (!isRecord(rawPackage)) return { error: 'Uno de los paquetes no es válido.' };
    const name = typeof rawPackage.name === 'string' ? rawPackage.name.trim() : '';
    const packageDescription = typeof rawPackage.description === 'string' ? rawPackage.description.trim() : '';
    const included = typeof rawPackage.included === 'string' ? rawPackage.included.trim() : '';
    const price = rawPackage.price;
    const deliveryDays = rawPackage.deliveryDays;

    if (!name || name.length > 50 || !packageDescription || packageDescription.length > 500 ||
        !included || included.length > 500 || typeof price !== 'number' ||
        !Number.isFinite(price) || price < 0.01 || price > 1000000 ||
        typeof deliveryDays !== 'number' || !Number.isInteger(deliveryDays) ||
        deliveryDays < 1 || deliveryDays > 365) {
      return { error: 'Revisa el nombre, precio, entrega y descripción de cada paquete.' };
    }

    packages.push({ name, description: packageDescription, included, price, deliveryDays });
  }

  const active = body.active === undefined ? true : body.active;
  const displayOrder = body.displayOrder === undefined ? 0 : body.displayOrder;
  if (typeof active !== 'boolean' || typeof displayOrder !== 'number' ||
      !Number.isInteger(displayOrder) || displayOrder < -1000 || displayOrder > 10000) {
    return { error: 'El estado o el orden de visualización no son válidos.' };
  }

  return {
    value: {
      ...(requireSlug ? { slug } : {}),
      category,
      title,
      description,
      rules: body.rules.map((rule) => (rule as string).trim()),
      images: body.images as string[],
      packages,
      active,
      displayOrder
    }
  };
}
