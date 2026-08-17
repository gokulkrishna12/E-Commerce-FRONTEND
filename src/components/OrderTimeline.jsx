import { FiClock, FiCheckCircle, FiTruck, FiPackage, FiXCircle } from "react-icons/fi";

const STEPS = [
  { key: "PENDING", label: "Placed", icon: FiClock },
  { key: "CONFIRMED", label: "Confirmed", icon: FiCheckCircle },
  { key: "SHIPPED", label: "Shipped", icon: FiTruck },
  { key: "DELIVERED", label: "Delivered", icon: FiPackage },
];

const OrderTimeline = ({ status }) => {
  if (status === "CANCELLED") {
    return (
      <div className="order-timeline cancelled">
        <FiXCircle size={16} />
        <span>This order was cancelled</span>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="order-timeline">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i <= currentIndex;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step.key} className={`timeline-step ${done ? "done" : ""}`}>
            <div className="timeline-dot"><Icon size={14} /></div>
            <span className="timeline-label">{step.label}</span>
            {!isLast && <div className={`timeline-line ${i < currentIndex ? "done" : ""}`} />}
          </div>
        );
      })}
    </div>
  );
};

export default OrderTimeline;