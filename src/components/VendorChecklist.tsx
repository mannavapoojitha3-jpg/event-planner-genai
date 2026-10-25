import type { VendorItem, VendorStatus } from '../engine/types';

interface VendorChecklistProps {
  vendors: VendorItem[];
  onStatusChange: (vendorId: string, status: VendorStatus) => void;
}

const STATUS_LABEL: Record<VendorStatus, string> = {
  'not-started': 'Not started',
  shortlisted: 'Shortlisted',
  booked: 'Booked',
};

const STATUSES = Object.keys(STATUS_LABEL) as VendorStatus[];

/** Narrows a form value to a known status, so nothing unexpected reaches the plan. */
function isVendorStatus(value: string): value is VendorStatus {
  return (STATUSES as readonly string[]).includes(value);
}

export function VendorChecklist({ vendors, onStatusChange }: VendorChecklistProps) {
  const booked = vendors.filter((vendor) => vendor.status === 'booked').length;
  const requiredOpen = vendors.filter((vendor) => vendor.required && vendor.status !== 'booked').length;

  return (
    <section className="card" aria-labelledby="vendor-heading">
      <h2 id="vendor-heading">Vendor checklist</h2>
      <p className="hint">
        These are roles to fill, not real vendors. Search local listings yourself and check availability and prices directly
        with each provider.
      </p>
      <p aria-live="polite">
        <strong>{booked}</strong> of {vendors.length} booked
        {requiredOpen > 0 ? `, ${requiredOpen} required roles still open` : ', all required roles covered'}.
      </p>
      <progress
        className="meter"
        value={booked}
        max={Math.max(vendors.length, 1)}
        aria-label={`${booked} of ${vendors.length} vendor roles booked`}
      />
      <ul className="vendor-list">
        {vendors.map((vendor) => (
          <li key={vendor.id} className="vendor-row">
            <div>
              <span className="vendor-row__role">{vendor.role}</span>{' '}
              <span className={`badge ${vendor.required ? 'badge--high' : 'badge--low'}`}>
                {vendor.required ? 'Required' : 'Optional'}
              </span>
            </div>
            <label className="visually-hidden" htmlFor={`status-${vendor.id}`}>
              Status for {vendor.role}
            </label>
            <select
              id={`status-${vendor.id}`}
              value={vendor.status}
              onChange={(e) => {
                if (isVendorStatus(e.target.value)) onStatusChange(vendor.id, e.target.value);
              }}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </section>
  );
}
