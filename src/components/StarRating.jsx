import { FiStar } from "react-icons/fi";
import "./StarRating.scss";

const StarRating = ({ value = 0, onChange, readOnly = false, size = 18 }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={`star-rating ${readOnly ? "readonly" : ""}`}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          className={`star-btn ${star <= value ? "filled" : ""}`}
          onClick={() => !readOnly && onChange && onChange(star)}
          disabled={readOnly}
        >
          <FiStar size={size} />
        </button>
      ))}
    </div>
  );
};

export default StarRating;