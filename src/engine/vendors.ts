import type { EventType, VendorItem } from './types';

interface VendorTemplate {
  role: string;
  required: boolean;
}

const VENDOR_TEMPLATES: Record<EventType, VendorTemplate[]> = {
  wedding: [
    { role: 'Venue', required: true },
    { role: 'Caterer', required: true },
    { role: 'Decorator / florist', required: true },
    { role: 'Photographer & videographer', required: true },
    { role: 'Music / DJ / band', required: false },
    { role: 'Makeup & attire', required: false },
  ],
  birthday: [
    { role: 'Venue or home setup', required: true },
    { role: 'Cake & catering', required: true },
    { role: 'Decorator', required: false },
    { role: 'Entertainer or activity host', required: false },
  ],
  community: [
    { role: 'Venue & permits', required: true },
    { role: 'Caterer', required: true },
    { role: 'Sound & AV', required: false },
    { role: 'Entertainers', required: false },
    { role: 'First-aid / safety provider', required: true },
  ],
};

/**
 * Lists the vendor roles an event type usually needs. This is a checklist of roles only:
 * it does not look up real vendors, availability, contact details or prices.
 */
export function generateVendors(type: EventType): VendorItem[] {
  return VENDOR_TEMPLATES[type].map((template) => ({
    id: `${type}:${template.role.toLowerCase().replace(/[^a-z]+/g, '-')}`,
    role: template.role,
    required: template.required,
    status: 'not-started',
  }));
}
