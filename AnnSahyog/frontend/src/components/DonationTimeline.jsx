import { Check, Utensils, Building2, Bike, Truck, PackageCheck, X } from "lucide-react";
import {
  DONATION_STEPS,
  getDonationStepIndex,
  isTerminalNegative,
  getStatusLabel,
} from "../utils/status";

const STEP_ICONS = [Utensils, Building2, Bike, Truck, PackageCheck];

/**
 * Read-only visual tracker for the donation lifecycle.
 * Derived purely from the donation's current status.
 */
function DonationTimeline({ status, title = "Rescue progress" }) {
  const cancelled = isTerminalNegative(status);
  const current = getDonationStepIndex(status);
  const reached = cancelled ? 0 : current;

  return (
    <section className="status-timeline-card" aria-label={title}>
      <h3>{title}</h3>
      <ol
        className={`status-timeline ${cancelled ? "is-cancelled" : ""}`}
        style={{ "--steps": DONATION_STEPS.length }}
      >
        {DONATION_STEPS.map((step, index) => {
          const Icon = STEP_ICONS[index];
          const done = index < reached || (index === reached && reached === DONATION_STEPS.length - 1);
          const isCurrent = index === reached && !done;
          return (
            <li
              key={step.key}
              className={`status-timeline-step ${done ? "is-done" : ""} ${isCurrent ? "is-current" : ""}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span className="status-timeline-marker">
                {done ? (
                  <Check size={15} strokeWidth={3} />
                ) : cancelled && isCurrent ? (
                  <X size={15} strokeWidth={3} />
                ) : (
                  <Icon size={14} />
                )}
              </span>
              <span>{step.label}</span>
            </li>
          );
        })}
      </ol>
      {cancelled && (
        <p className="status-timeline-note">
          This donation was marked <strong>{getStatusLabel(status)}</strong>.
        </p>
      )}
    </section>
  );
}

export default DonationTimeline;
