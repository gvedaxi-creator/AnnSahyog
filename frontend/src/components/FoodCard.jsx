import { Link } from "react-router-dom";
import { handleImageFallback } from "../utils/imageFallback";
import { getFoodImage } from "../utils/foodImage";
import {
  MapPin,
  Scale,
  ArrowRight,
  Sparkles,
} from "lucide-react";

function FoodCard({ food }) {
  const isAvailable = food.status ? food.status === "AVAILABLE" : true;

  return (
    <article className="food-card">
      <div className="food-image">
        <img
          onError={handleImageFallback}
          src={getFoodImage(food)}
          alt={food.food_type || "Food donation"}
          loading="lazy"
        />

        <div className="food-availability">
          <span className={`availability-dot ${isAvailable ? "dot-available" : ""}`}></span>
          <span className="availability-text">
            {isAvailable ? "Available now" : food.status}
          </span>
        </div>
      </div>

      <div className="food-info">
        <div className="food-top-row">
          <span className="food-eyebrow">
            {food.category || "FRESH DONATION"}
          </span>
          {food.donor_name && (
            <span className="food-donor-chip" title={`Listed by ${food.donor_name}`}>
              {food.donor_name}
            </span>
          )}
        </div>

        <h3 title={food.food_type}>{food.food_type}</h3>

        <div className="food-meta">
          <div className="meta-col">
            <small>
              <Scale size={13} /> Quantity
            </small>
            <strong>
              {food.quantity} {food.unit}
            </strong>
          </div>

          <div className="meta-col">
            <small>
              <MapPin size={13} /> Location
            </small>
            <strong>{food.city || "Nearby"}</strong>
          </div>
        </div>

        <div className="food-footer">
          <span className="pickup-status">
            <Sparkles size={13} /> Safe for Consumption
          </span>

          <Link
            to={`/donation/${food.donation_id}`}
            className="food-view-btn"
            aria-label={`View details for ${food.food_type}`}
          >
            <span>View</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default FoodCard;
