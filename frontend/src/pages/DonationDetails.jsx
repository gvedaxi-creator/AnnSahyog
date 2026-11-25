import { Link, useParams } from "react-router-dom";
import { handleImageFallback } from "../utils/imageFallback";
import { getFoodImage } from "../utils/foodImage";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  ArrowLeft,
  Scale,
  Calendar,
  Clock,
  MapPin,
  Building2,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

function DonationDetails({ donations = [] }) {
  const { id } = useParams();

  const donation = donations.find(
    (food) => String(food.donation_id) === String(id)
  );

  const isAvailable = donation ? donation.status === "AVAILABLE" || !donation.status : false;

  if (!donation) {
    return (
      <div className="app">
        <Navbar />

        <main className="donation-details-page">
          <div className="container">
            <div className="dashboard-empty-card" style={{ margin: "4rem auto", maxWidth: "600px" }}>
              <div className="empty-icon-wrap icon-danger">
                <AlertCircle size={36} />
              </div>
              <h2>Donation Not Found</h2>
              <p>This surplus batch may have already been claimed and delivered to a community shelter.</p>
              <Link to="/#food" className="btn btn-primary btn-sm">
                <ArrowLeft size={15} />
                <span>Explore Available Food</span>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />

      <main className="donation-details-page">
        <div className="container">
          <div className="admin-back-bar">
            <Link to="/" className="admin-back-link">
              <ArrowLeft size={16} />
              <span>Back to Food Available</span>
            </Link>
          </div>

          <div className="public-donation-card-layout">
            <div className="donation-details-image-panel">
              <img
                onError={handleImageFallback}
                src={getFoodImage(donation, 1200)}
                alt={donation.food_type || "Fresh food"}
                className="public-donation-hero-img"
              />

              <div className="public-donation-img-overlay">
                <span className="public-availability-chip">
                  <span className={`availability-dot ${isAvailable ? "dot-available" : ""}`}></span>
                  {isAvailable ? "Available For Claim" : donation.status}
                </span>
              </div>
            </div>

            <div className="donation-details-content-panel">
              <div className="donation-details-header">
                <span className="food-eyebrow">
                  {donation.category || "FRESH COMMUNITY RESCUE"} · ID #{donation.donation_id}
                </span>
                <h1>{donation.food_type}</h1>
                <p className="donation-description">
                  {donation.description ||
                    "Fresh surplus food verified and made available for immediate redistribution to local shelters."}
                </p>
              </div>

              <div className="donation-info-grid">
                <div className="info-item-block">
                  <small>
                    <Scale size={13} /> Portion / Quantity
                  </small>
                  <strong>
                    {donation.quantity} {donation.unit}
                  </strong>
                </div>

                <div className="info-item-block">
                  <small>
                    <MapPin size={13} /> City Location
                  </small>
                  <strong>{donation.city || "Ahmedabad"}</strong>
                </div>

                <div className="info-item-block">
                  <small>
                    <Clock size={13} /> Prepared
                  </small>
                  <strong>
                    {donation.prepared_date
                      ? new Date(donation.prepared_date).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "Freshly prepared"}
                  </strong>
                </div>

                <div className="info-item-block">
                  <small>
                    <Calendar size={13} /> Best Before
                  </small>
                  <strong className="text-warning">
                    {donation.expiry_date
                      ? new Date(donation.expiry_date).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "Same-day distribution"}
                  </strong>
                </div>
              </div>

              <div className="public-pickup-protocol">
                <div className="protocol-header">
                  <ShieldCheck size={18} />
                  <strong>Hygiene & Food Safety Guaranteed</strong>
                </div>
                <p>
                  AnnSahyog coordinates with certified NGOs and trained volunteer couriers to maintain food-grade handling during transit.
                </p>
              </div>

              <div className="public-claim-cta">
                <Link to="/login" className="btn btn-primary btn-large">
                  <Building2 size={18} />
                  <span>Request Food for Your NGO</span>
                  <ArrowRight size={16} />
                </Link>
                <Link to="/register?role=ngo" className="btn btn-light">
                  Register as NGO
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default DonationDetails;
