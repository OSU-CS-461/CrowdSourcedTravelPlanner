import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientRoutes } from "../../../shared/clientRoutes";
import {
  apiClient,
  setAuthToken,
  getMyLikedExperiences,
  getMyLikedTrips,
  likeExperience,
  unlikeExperience,
  likeTrip,
  unlikeTrip,
} from "../../../shared/services/api.service";
import "./HomePage.css";

function formatApiError(
  responseError: unknown,
  err: unknown,
  fallback: string
): string {
  if (typeof responseError === "string" && responseError.trim()) {
    if (/invalid signature|jwt expired|unauthorized/i.test(responseError)) {
      return "Session expired or invalid — please log out and sign in again.";
    }
    return responseError;
  }
  if (err && typeof err === "object" && "message" in err) {
    const m = String((err as { message: unknown }).message);
    if (/401|invalid signature|jwt expired/i.test(m)) {
      return "Session expired or invalid — please log out and sign in again.";
    }
  }
  return fallback;
}

type Experience = {
  id: number;
  title: string;
  description: string;
  dateCreated: string;
  createdByUsername?: string | null;
  thumbnail?: string;
  country?: string;
  city?: string;
  adminRegion?: string;
};

type Trip = {
  id: number;
  title: string;
  description?: string;
  dateCreated: string;
};

export default function HomePage() {
  const navigate = useNavigate();

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [likedExperienceIds, setLikedExperienceIds] = useState<Set<number>>(
    () => new Set()
  );
  const [likedTripIds, setLikedTripIds] = useState<Set<number>>(() => new Set());
  const [likesLoading, setLikesLoading] = useState(true);
  const [experiencesError, setExperiencesError] = useState<string | null>(null);
  const [tripsError, setTripsError] = useState<string | null>(null);
  const [experiencesLoaded, setExperiencesLoaded] = useState(false);
  const [tripsLoaded, setTripsLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("cstp.auth.token");
    if (token) setAuthToken(token);

    void apiClient
      .get("/experiences")
      .then((res) => {
        setExperiences(res.data);
        setExperiencesError(null);
      })
      .catch((err: unknown) => {
        console.error(err);
        const msg =
          err &&
          typeof err === "object" &&
          "response" in err &&
          (err as { response?: { data?: { error?: unknown } } }).response?.data
            ?.error;
        setExperiencesError(
          formatApiError(msg, err, "Could not load experiences.")
        );
        setExperiences([]);
      })
      .finally(() => setExperiencesLoaded(true));

    void apiClient
      .get("/trips")
      .then((res) => {
        setTrips(res.data);
        setTripsError(null);
      })
      .catch((err: unknown) => {
        console.error(err);
        const msg =
          err &&
          typeof err === "object" &&
          "response" in err &&
          (err as { response?: { data?: { error?: unknown } } }).response?.data
            ?.error;
        setTripsError(formatApiError(msg, err, "Could not load trips."));
        setTrips([]);
      })
      .finally(() => setTripsLoaded(true));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("cstp.auth.token");
    if (!token) {
      setLikesLoading(false);
      return;
    }
    setAuthToken(token);
    let cancelled = false;
    void (async () => {
      try {
        setLikesLoading(true);
        const [likedExps, likedTripsList] = await Promise.all([
          getMyLikedExperiences(),
          getMyLikedTrips(),
        ]);
        if (cancelled) return;
        setLikedExperienceIds(new Set(likedExps.map((e) => e.id)));
        setLikedTripIds(new Set(likedTripsList.map((t) => t.id)));
      } catch (err) {
        console.error("Failed to load saved experiences/trips:", err);
      } finally {
        if (!cancelled) setLikesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleExperienceLike = async (id: number) => {
    const token = localStorage.getItem("cstp.auth.token");
    if (!token) return;
    const wasLiked = likedExperienceIds.has(id);
    setLikedExperienceIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      if (wasLiked) await unlikeExperience(id);
      else await likeExperience(id);
    } catch (err) {
      setLikedExperienceIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(id);
        else next.delete(id);
        return next;
      });
      console.error(err);
    }
  };

  const toggleTripLike = async (id: number) => {
    const token = localStorage.getItem("cstp.auth.token");
    if (!token) return;
    const wasLiked = likedTripIds.has(id);
    setLikedTripIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      if (wasLiked) await unlikeTrip(id);
      else await likeTrip(id);
    } catch (err) {
      setLikedTripIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(id);
        else next.delete(id);
        return next;
      });
      console.error(err);
    }
  };

  return (
    <main className="page-container">
      <h1>Welcome to CrowdSourced Travel Planner</h1>
      <p>Your authenticated travel dashboard.</p>

      <div className="button-group">
        <button
          className="btn btn-experience"
          onClick={() => navigate(ClientRoutes.EXPERIENCE_CREATE)}
        >
          + Create New Experience
        </button>

        <button
          className="btn btn-trip"
          onClick={() => navigate(ClientRoutes.TRIP_CREATE)}
        >
          + Create New Trip
        </button>
      </div>

      {(experiencesError || tripsError) && (
        <div className="home-api-error" role="alert">
          {experiencesError ? <p>{experiencesError}</p> : null}
          {tripsError ? <p>{tripsError}</p> : null}
          <p className="home-api-error-hint">
            If tables are missing: in <code>server</code> run{" "}
            <code>{`npm run prisma:migrate:deploy`}</code>. If you see{" "}
            <code>prepared statement s0</code>, restart Prisma dev (
            <code>npx prisma dev stop default</code> then <code>npx prisma dev</code>
            ), then run migrate again. Refresh after.
          </p>
        </div>
      )}

      <h2>Your Experiences</h2>

      {!experiencesLoaded ? (
        <p>Loading experiences…</p>
      ) : experiencesError ? null : experiences.length === 0 ? (
        <p>No experiences found. Start by creating one!</p>
      ) : (
        <div>
          {experiences.map((exp) => {
            const liked = likedExperienceIds.has(exp.id);
            return (
              <div key={exp.id} className="card card--dashboard">
                <div className="card-main">
                  <h2
                    className="card-title"
                    onClick={() =>
                      navigate(
                        ClientRoutes.EXPERIENCE_DETAILS.replace(
                          ":id",
                          exp.id.toString()
                        ),
                        { state: { experience: exp } }
                      )
                    }
                  >
                    {exp.title}
                  </h2>

                  <div className="card-meta">
                    {exp.city ? `${exp.city}, ` : ""}
                    {exp.adminRegion ? `${exp.adminRegion}, ` : ""}
                    {exp.country || "Global"} -{" "}
                    {new Date(exp.dateCreated).toLocaleDateString()}
                  </div>

                  <p className="card-description">
                    {exp.description && exp.description.length > 160
                      ? `${exp.description.substring(0, 160)}...`
                      : exp.description ||
                        "Discover more about this hidden gem..."}
                  </p>
                </div>
                <button
                  type="button"
                  className={`dashboard-like-btn${liked ? " is-liked" : ""}`}
                  disabled={likesLoading}
                  title={liked ? "Remove from saved" : "Save experience"}
                  aria-pressed={liked}
                  aria-label={
                    liked ? "Remove experience from saved" : "Save experience"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    void toggleExperienceLike(exp.id);
                  }}
                >
                  {liked ? "♥" : "♡"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="section-title">Your Trips</h2>

      {!tripsLoaded ? (
        <p>Loading trips…</p>
      ) : tripsError ? null : trips.length === 0 ? (
        <p>No trips found. Create one!</p>
      ) : (
        <div>
          {trips.map((trip) => {
            const liked = likedTripIds.has(trip.id);
            return (
              <div key={trip.id} className="card card--dashboard">
                <div className="card-main">
                  <h2
                    className="card-title"
                    onClick={() =>
                      navigate(
                        ClientRoutes.TRIP_DETAILS.replace(
                          ":id",
                          trip.id.toString()
                        )
                      )
                    }
                  >
                    {trip.title}
                  </h2>

                  <div className="card-meta">
                    {new Date(trip.dateCreated).toLocaleDateString()}
                  </div>

                  <p className="card-description">
                    {trip.description || "Plan your next adventure."}
                  </p>
                </div>
                <button
                  type="button"
                  className={`dashboard-like-btn${liked ? " is-liked" : ""}`}
                  disabled={likesLoading}
                  title={liked ? "Remove from saved" : "Save trip"}
                  aria-pressed={liked}
                  aria-label={liked ? "Remove trip from saved" : "Save trip"}
                  onClick={(e) => {
                    e.stopPropagation();
                    void toggleTripLike(trip.id);
                  }}
                >
                  {liked ? "♥" : "♡"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
