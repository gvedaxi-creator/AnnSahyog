/* ========================================================
   ANNSAHYOG — LANDING PAGE
   Food Redistribution & Rescue Network
   ======================================================== */

import { useEffect, useState } from "react";
import { handleImageFallback } from "../utils/imageFallback";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import FoodCard from "../components/FoodCard";
import Footer from "../components/Footer";
import {
  HeartHandshake,
  Building2,
  Bike,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Utensils,
  TrendingUp,
  Clock,
  Send,
  Search,
  PackageCheck,
  Leaf,
  PhoneCall,
  Mail,
  AlertCircle,
} from "lucide-react";

function Home({
  donations = [],
  donationsLoading = false,
  donationsError = "",
}) {
  const [donationCount, setDonationCount] = useState(0);
  const [homeStats, setHomeStats] = useState(null);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    inquiryType: "General Inquiry",
    message: "",
  });
  const [contactErrors, setContactErrors] = useState({});
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState("");

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific error as user types
    if (contactErrors[name]) {
      setContactErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateContactForm = () => {
    const errors = {};

    if (!contactForm.name.trim()) {
      errors.name = "Please enter your full name.";
    } else if (contactForm.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }

    if (!contactForm.email.trim()) {
      errors.email = "Please enter your email address.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email.trim())
    ) {
      errors.email = "Please enter a valid email address (e.g., name@example.com).";
    }

    if (!contactForm.subject.trim()) {
      errors.subject = "Please enter a subject for your inquiry.";
    } else if (contactForm.subject.trim().length < 3) {
      errors.subject = "Subject must be at least 3 characters.";
    }

    if (!contactForm.message.trim()) {
      errors.message = "Please enter your message.";
    } else if (contactForm.message.trim().length < 10) {
      errors.message = "Message must contain at least 10 characters.";
    }

    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactSuccess("");

    if (!validateContactForm()) {
      return;
    }

    setContactSubmitting(true);

    try {
      // Simulate submission turnaround
      await new Promise((resolve) => setTimeout(resolve, 600));

      setContactSuccess(
        `Thank you, ${contactForm.name}! Your message regarding "${contactForm.subject}" has been received. Our coordination team will get back to you at ${contactForm.email} within 24 hours.`
      );

      // Reset form
      setContactForm({
        name: "",
        email: "",
        subject: "",
        inquiryType: "General Inquiry",
        message: "",
      });
      setContactErrors({});
    } catch (err) {
      console.error("Contact form error:", err);
    } finally {
      setContactSubmitting(false);
    }
  };

  // Load live counts from the database
  useEffect(() => {
    let cancelled = false;
    fetch("http://localhost:5000/api/public/home-stats")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.success) setHomeStats(d.stats);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Animated counter for live rescues, counting up to the real donation total
  useEffect(() => {
    const target = homeStats?.donations ?? 0;
    const interval = setInterval(() => {
      setDonationCount((current) => {
        if (current >= target) {
          clearInterval(interval);
          return target;
        }
        return Math.min(current + 1, target);
      });
    }, 25);

    return () => clearInterval(interval);
  }, [homeStats]);

  const fmt = (n) => (homeStats ? Number(n).toLocaleString("en-IN") : "—");

  const journeySteps = [
    {
      number: "01",
      icon: Utensils,
      title: "Donate",
      subtitle: "Donor Lists Surplus",
      text: "Caterers, restaurants, and individuals list fresh, safe excess meals on the network.",
    },
    {
      number: "02",
      icon: Search,
      title: "Discover",
      subtitle: "NGOs Find Food",
      text: "Verified local NGOs and community shelters view real-time available listings nearby.",
    },
    {
      number: "03",
      icon: HeartHandshake,
      title: "Request",
      subtitle: "Claim & Approve",
      text: "The receiving organization requests required portions; donor instantly approves.",
    },
    {
      number: "04",
      icon: Bike,
      title: "Connect",
      subtitle: "Volunteer Dispatched",
      text: "Nearby volunteer drivers accept the rescue task and navigate to pickup location.",
    },
    {
      number: "05",
      icon: PackageCheck,
      title: "Deliver",
      subtitle: "Safe Transport",
      text: "Food is picked up, temperature-checked, and safely delivered to the shelter.",
    },
    {
      number: "06",
      icon: Sparkles,
      title: "Impact",
      subtitle: "Verified Delivery",
      text: "The shelter confirms receipt, closing the loop with verified community impact.",
    },
  ];

  return (
    <div className="app">
      <Navbar />

      {/* ========================================================
          1. HERO SECTION
          ======================================================== */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="live-pulse-dot" aria-hidden="true"></span>
              <span className="eyebrow-text">A Community-Powered Food Rescue Network</span>
            </div>

            <h1>
              Food that has <em>more</em> to give.
            </h1>

            <p className="hero-lead-text">
              AnnSahyog connects safe surplus food from donors with receiving NGOs
              and dedicated volunteer couriers — creating a single, transparent, and
              dignified journey from waste reduction to community nourishment.
            </p>

            <div className="hero-buttons">
              <Link
                to="/register?role=donor"
                className="btn btn-primary btn-large btn-hero-primary"
              >
                <Utensils size={18} />
                <span>Donate Surplus Food</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/register?role=ngo"
                className="btn btn-light btn-large btn-hero-secondary"
              >
                <Building2 size={18} />
                <span>Find Food for Your NGO</span>
              </Link>
            </div>

            <div className="hero-proof">
              <div className="proof-card">
                <div className="proof-icon-wrap">
                  <Utensils size={16} />
                </div>
                <div>
                  <strong>Listed Real-Time</strong>
                  <span>Donors post fresh food</span>
                </div>
              </div>

              <div className="proof-card">
                <div className="proof-icon-wrap">
                  <Building2 size={16} />
                </div>
                <div>
                  <strong>Claimed Locally</strong>
                  <span>NGOs feed shelters</span>
                </div>
              </div>

              <div className="proof-card">
                <div className="proof-icon-wrap">
                  <Bike size={16} />
                </div>
                <div>
                  <strong>Delivered Fast</strong>
                  <span>Volunteers bridge the gap</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image">
              <img
                onError={handleImageFallback}
                src="/hero-volunteers.png"
                alt="AnnSahyog volunteers packing fresh meals for redistribution"
              />
            </div>

            <div className="hero-label">
              <div className="hero-label-tag">
                <Leaf size={14} /> Zero Waste Mission
              </div>
              <strong>Food Today</strong>
              <span>A Better Tomorrow</span>
            </div>

            <div className="floating-card">
              <div className="floating-icon">
                <Sparkles size={24} />
              </div>

              <div>
                <strong>+{donationCount}</strong>
                <span>Verified Rescues Listed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. COMMUNITY STORY & MISSION
          ======================================================== */}
      <section className="story-section" id="about">
        <div className="container">
          <div className="story-grid">
            <div className="story-image-wrap">
              <div className="story-image">
                <img
                  onError={handleImageFallback}
                  src="https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?auto=format&fit=crop&w=1000&q=85"
                  alt="Volunteers sharing food with community members"
                />
              </div>

              <div className="story-badge">
                <div className="story-badge-header">
                  <Sparkles size={16} />
                  <strong>Food Today</strong>
                </div>
                <span>A Better Tomorrow</span>
              </div>
            </div>

            <div className="story-content">
              <span className="section-kicker">Why AnnSahyog exists</span>

              <h2>
                The problem isn't always a lack of food.
                <br />
                It's the <em>missing connection.</em>
              </h2>

              <p className="story-lead">
                Every evening, tonnes of safe, edible food are discarded while shelter
                kitchens just a few kilometers away struggle to meet daily demand.
                AnnSahyog bridges that exact operational gap.
              </p>

              <div className="story-points">
                <div className="story-point">
                  <span className="story-num">01</span>
                  <div>
                    <strong>Donors need effortless visibility.</strong>
                    <p>
                      A streamlined listing interface that takes under 60 seconds to notify
                      nearby shelters of excess portions.
                    </p>
                  </div>
                </div>

                <div className="story-point">
                  <span className="story-num">02</span>
                  <div>
                    <strong>NGOs need predictable access.</strong>
                    <p>
                      Real-time inventory visibility so community kitchens can plan
                      distributions without uncertainty.
                    </p>
                  </div>
                </div>

                <div className="story-point">
                  <span className="story-num">03</span>
                  <div>
                    <strong>Volunteers need synchronized coordination.</strong>
                    <p>
                      Clear contact details, live status milestones, and instant routing to
                      ensure timely food rescue.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. HOW IT WORKS / 6-STEP TIMELINE
          ======================================================== */}
      <section className="journey-section" id="how-it-works">
        <div className="container">
          <div className="journey-intro">
            <div>
              <span className="section-kicker">The AnnSahyog Lifecycle</span>
              <h2>
                From surplus
                <br />
                <em>to shared meals.</em>
              </h2>
            </div>

            <p>
              Every meal has a story. AnnSahyog automates each transition so food
              moves safely, transparently, and swiftly from where it is surplus to where
              it is needed most.
            </p>
          </div>

          <div className="journey-timeline">
            {journeySteps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div className="journey-step" key={step.number}>
                  <div className="journey-step-top">
                    <div className="journey-step-icon" aria-hidden="true">
                      <StepIcon size={22} />
                    </div>
                    <span className="journey-number">{step.number}</span>
                  </div>

                  <span className="journey-subtag">{step.subtitle}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              );
            })}
          </div>

          <div className="journey-bottom">
            <span className="journey-bottom-tag">The Connected Loop</span>
            <strong>Food Donor → NGO Request → Volunteer Pickup → Community Delivery</strong>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. AVAILABLE FOOD SHOWCASE
          ======================================================== */}
      <section className="food-section" id="food">
        <div className="container">
          <div className="food-header">
            <div>
              <span className="section-kicker">Food available today</span>
              <h2>
                Good food,
                <br />
                <em>ready to move now.</em>
              </h2>
              <p className="food-header-text">
                Surplus food actively listed by certified donors and awaiting NGO claim.
              </p>
            </div>

            <div className="food-header-right">
              <Link to="/login" className="btn btn-light btn-browse-all">
                <span>Browse all listings</span>
              </Link>
            </div>
          </div>

          <div className="food-grid">
            {donationsLoading && (
              <div className="food-loading-card">
                <div className="food-spinner"></div>
                <p>Loading available food listings...</p>
              </div>
            )}

            {donationsError && (
              <div className="food-error-card">
                <AlertCircle size={24} />
                <p>{donationsError}</p>
              </div>
            )}

            {!donationsLoading && !donationsError && donations.length === 0 && (
              <div className="food-empty-card">
                <Utensils size={36} />
                <h3>No active food listings right now</h3>
                <p>Donations are updated in real-time. Have surplus to share?</p>
                <Link to="/register?role=donor" className="btn btn-primary btn-sm">
                  List Food as Donor →
                </Link>
              </div>
            )}

            {!donationsLoading &&
              !donationsError &&
              donations
                .slice(0, 3)
                .map((food) => <FoodCard key={food.donation_id} food={food} />)}
          </div>

          <div className="food-network-note">
            <span>New food batches are listed throughout the day across local city zones.</span>
            <Link to="/register?role=donor">List surplus food →</Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. PLATFORM IMPACT METRICS
          ======================================================== */}
      <section className="impact-section" id="impact">
        <div className="container">
          <div className="section-heading dark">
            <div>
              <span className="section-kicker">AnnSahyog in motion</span>
              <h2>
                Small actions.
                <br />
                A connected, measurable impact.
              </h2>
            </div>

            <p>
              Every surplus listing initiates a coordinated sequence between food donors,
              verified NGOs, and active volunteer couriers to eliminate hunger.
            </p>
          </div>

          <div className="impact-grid">
            <div className="impact-card">
              <div className="impact-icon-circle">
                <Utensils size={24} />
              </div>
              <strong>{fmt(homeStats?.meals)}</strong>
              <span>Meals Rescued</span>
              <small>Redirected from landfill to tables</small>
            </div>

            <div className="impact-card">
              <div className="impact-icon-circle">
                <TrendingUp size={24} />
              </div>
              <strong>{fmt(homeStats?.donations)}</strong>
              <span>Food Donations</span>
              <small>Shared by restaurants & caterers</small>
            </div>

            <div className="impact-card">
              <div className="impact-icon-circle">
                <PackageCheck size={24} />
              </div>
              <strong>{fmt(homeStats?.deliveries)}</strong>
              <span>Deliveries Completed</span>
              <small>Verified by receiving shelters</small>
            </div>

            <div className="impact-card">
              <div className="impact-icon-circle">
                <Bike size={24} />
              </div>
              <strong>{fmt(homeStats?.volunteers)}</strong>
              <span>Active Volunteers</span>
              <small>On duty moving food where it matters</small>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. ROLE SELECTION / GET INVOLVED
          ======================================================== */}
      <section className="roles-section" id="join">
        <div className="container">
          <div className="roles-heading">
            <div>
              <span className="section-kicker">There is a place for you</span>
              <h2>
                One mission.
                <br />
                <em>Three ways to make a difference.</em>
              </h2>
            </div>

            <p>
              Whether you have excess food, run a community shelter, or have time to move
              deliveries, your contribution is vital.
            </p>
          </div>

          <div className="roles-grid">
            {/* Donor */}
            <article className="role-card donor-card">
              <div className="role-card-top">
                <div className="role-icon-box donor-icon-box">
                  <Utensils size={24} />
                </div>
                <span className="role-step-number">01</span>
              </div>

              <h3>Food Donor</h3>
              <p>
                Restaurants, event caterers, hotels, and households. Share safe surplus
                food easily and get verified pickup confirmation.
              </p>

              <ul className="role-perks">
                <li>
                  <CheckCircle2 size={16} className="perk-check" />
                  <span>Reduce food wastage</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="perk-check" />
                  <span>Real-time status tracking</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="perk-check" />
                  <span>Social impact metrics</span>
                </li>
              </ul>

              <div className="role-action">
                <Link to="/register?role=donor" className="role-action-btn">
                  <span>Register as Food Donor</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>

            {/* NGO */}
            <article className="role-card ngo-card">
              <div className="role-card-top">
                <div className="role-icon-box ngo-icon-box">
                  <Building2 size={24} />
                </div>
                <span className="role-step-number">02</span>
              </div>

              <h3>NGO / Receiving Shelter</h3>
              <p>
                Shelters, community kitchens, and orphanages. Discover available food
                batches nearby, claim portions, and feed more people daily.
              </p>

              <ul className="role-perks">
                <li>
                  <CheckCircle2 size={16} className="perk-check" />
                  <span>Verified food quality</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="perk-check" />
                  <span>Free doorstep deliveries</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="perk-check" />
                  <span>Direct donor collaboration</span>
                </li>
              </ul>

              <div className="role-action">
                <Link to="/register?role=ngo" className="role-action-btn">
                  <span>Register as NGO</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>

            {/* Volunteer */}
            <article className="role-card volunteer-card">
              <div className="role-card-top">
                <div className="role-icon-box vol-icon-box">
                  <Bike size={24} />
                </div>
                <span className="role-step-number">03</span>
              </div>

              <h3>Rescue Volunteer</h3>
              <p>
                Join our courier network. Pick up surplus food from donors and safely
                transport it to local receiving centers in your spare time.
              </p>

              <ul className="role-perks">
                <li>
                  <CheckCircle2 size={16} className="perk-check" />
                  <span>Flexible on/off duty</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="perk-check" />
                  <span>Turn-by-turn task tracker</span>
                </li>
                <li>
                  <CheckCircle2 size={16} className="perk-check" />
                  <span>Hero impact recognition</span>
                </li>
              </ul>

              <div className="role-action">
                <Link to="/register?role=volunteer" className="role-action-btn">
                  <span>Join as Volunteer</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. CONTACT & INQUIRIES SECTION
          ======================================================== */}
      <section className="contact-section" id="contact">
        <div className="container">
          <div className="contact-intro">
            <div>
              <span className="section-kicker">Get in Touch</span>
              <h2>
                Let's connect &
                <br />
                <em>make a difference together.</em>
              </h2>
            </div>
            <p>
              Have questions, partnership proposals, or want to sponsor food rescue
              logistics in your city? Reach out to our community coordination team.
            </p>
          </div>

          <div className="contact-grid">
            {/* Left: Contact Channels */}
            <div className="contact-info-panel">
              <div className="contact-info-card">
                <div className="contact-info-header">
                  <h3>Direct Coordination Hub</h3>
                  <p>
                    Reach our central dispatch and partner onboarding team in Ahmedabad.
                  </p>
                </div>

                <div className="contact-channels-list">
                  <a href="mailto:contact@annsahyog.org" className="contact-channel-item">
                    <div className="contact-icon-box">
                      <Mail size={20} />
                    </div>
                    <div className="contact-channel-text">
                      <small>Email Support</small>
                      <strong>contact@annsahyog.org</strong>
                      <span>support@annsahyog.org</span>
                    </div>
                  </a>

                  <a href="tel:+919876543210" className="contact-channel-item">
                    <div className="contact-icon-box">
                      <PhoneCall size={20} />
                    </div>
                    <div className="contact-channel-text">
                      <small>Rescue Helpline</small>
                      <strong>+91 98765 43210</strong>
                      <span>Mon – Sat: 8:00 AM – 9:00 PM</span>
                    </div>
                  </a>

                  <div className="contact-channel-item">
                    <div className="contact-icon-box">
                      <MapPin size={20} />
                    </div>
                    <div className="contact-channel-text">
                      <small>Headquarters</small>
                      <strong>AnnSahyog Network Hub</strong>
                      <span>Navrangpura, Ahmedabad, Gujarat 380009</span>
                    </div>
                  </div>

                  <div className="contact-channel-item">
                    <div className="contact-icon-box">
                      <Clock size={20} />
                    </div>
                    <div className="contact-channel-text">
                      <small>Surplus Rescue Dispatch</small>
                      <strong>24/7 Active Operations</strong>
                      <span>Fast turnaround for event surplus</span>
                    </div>
                  </div>
                </div>

                <div className="contact-partnership-note">
                  <div className="partnership-icon">
                    <HeartHandshake size={22} />
                  </div>
                  <div>
                    <strong>Institutional Partnerships</strong>
                    <p>
                      Hotels, wedding banquet halls, or corporate canteens looking for
                      scheduled daily food pickups?{" "}
                      <a href="mailto:partner@annsahyog.org">Email our partnerships desk →</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Contact Form */}
            <div className="contact-form-panel">
              <div className="contact-form-card">
                <div className="contact-form-header">
                  <h3>Send Us a Message</h3>
                  <p>Fill out the inquiry form and our team will get back to you promptly.</p>
                </div>

                {contactSuccess ? (
                  <div className="contact-success-box">
                    <div className="success-icon-large">
                      <CheckCircle2 size={36} />
                    </div>
                    <h4>Message Sent Successfully!</h4>
                    <p>{contactSuccess}</p>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setContactSuccess("")}
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form className="contact-form" onSubmit={handleContactSubmit} noValidate>
                    <div className="contact-form-grid">
                      {/* Name */}
                      <div className="form-field">
                        <label htmlFor="contact-name">
                          Full Name <span className="req-star">*</span>
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          name="name"
                          value={contactForm.name}
                          onChange={handleContactChange}
                          placeholder="e.g. Priyanshu Sharma"
                          className={contactErrors.name ? "input-error" : ""}
                          aria-invalid={!!contactErrors.name}
                          required
                        />
                        {contactErrors.name && (
                          <span className="field-error-msg">{contactErrors.name}</span>
                        )}
                      </div>

                      {/* Email */}
                      <div className="form-field">
                        <label htmlFor="contact-email">
                          Email Address <span className="req-star">*</span>
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          name="email"
                          value={contactForm.email}
                          onChange={handleContactChange}
                          placeholder="e.g. priyanshu@example.com"
                          className={contactErrors.email ? "input-error" : ""}
                          aria-invalid={!!contactErrors.email}
                          required
                        />
                        {contactErrors.email && (
                          <span className="field-error-msg">{contactErrors.email}</span>
                        )}
                      </div>

                      {/* Subject */}
                      <div className="form-field">
                        <label htmlFor="contact-subject">
                          Subject <span className="req-star">*</span>
                        </label>
                        <input
                          id="contact-subject"
                          type="text"
                          name="subject"
                          value={contactForm.subject}
                          onChange={handleContactChange}
                          placeholder="e.g. Bulk food rescue partnership"
                          className={contactErrors.subject ? "input-error" : ""}
                          aria-invalid={!!contactErrors.subject}
                          required
                        />
                        {contactErrors.subject && (
                          <span className="field-error-msg">{contactErrors.subject}</span>
                        )}
                      </div>

                      {/* Inquiry Type */}
                      <div className="form-field">
                        <label htmlFor="contact-inquiry">Inquiry Type</label>
                        <select
                          id="contact-inquiry"
                          name="inquiryType"
                          value={contactForm.inquiryType}
                          onChange={handleContactChange}
                        >
                          <option value="General Inquiry">General Inquiry</option>
                          <option value="Food Donation">Food Donation</option>
                          <option value="NGO Partnership">NGO Partnership</option>
                          <option value="Volunteer Opportunities">Volunteer Opportunities</option>
                          <option value="Technical Support">Technical Support</option>
                          <option value="Feedback">Feedback</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Message */}
                      <div className="form-field full-width">
                        <label htmlFor="contact-message">
                          Message <span className="req-star">*</span>
                        </label>
                        <textarea
                          id="contact-message"
                          name="message"
                          rows="4"
                          value={contactForm.message}
                          onChange={handleContactChange}
                          placeholder="How can our food redistribution network assist you? Please provide relevant details..."
                          className={contactErrors.message ? "input-error" : ""}
                          aria-invalid={!!contactErrors.message}
                          required
                        />
                        {contactErrors.message && (
                          <span className="field-error-msg">{contactErrors.message}</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-orange btn-contact-submit"
                      disabled={contactSubmitting}
                    >
                      {contactSubmitting ? (
                        <>
                          <div className="btn-spinner"></div>
                          <span>Sending message...</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>Submit Message</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>

                    <p className="contact-privacy-note">
                      We respect your privacy. Your information is strictly used to coordinate inquiries and never shared.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          8. CALL TO ACTION BANNER
          ======================================================== */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-box">
            <div className="cta-content">
              <span className="cta-eyebrow">
                <Sparkles size={14} /> Join the Movement
              </span>
              <h2>Let's make every surplus meal count today.</h2>
              <p>Food Today • A Better Tomorrow</p>
            </div>

            <div className="cta-actions">
              <Link to="/register?role=donor" className="btn btn-orange btn-large">
                <Utensils size={18} />
                <span>Donate Surplus Food</span>
                <ArrowRight size={16} />
              </Link>

              <Link to="/register" className="btn btn-light btn-large">
                <span>Explore All Roles</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Home;
