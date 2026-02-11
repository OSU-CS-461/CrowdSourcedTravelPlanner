import { useNavigate } from "react-router-dom";
import { ClientRoutes } from "../../../utils/clientRoutes";
import TripFormTemplate, {type TripFormValues} from "../components/TripFormTemplate";
import { setAuthToken } from "../../../shared/services/api.service";
import { apiClient } from "../../../shared/services/api.service";

export default function CreateTripPage() {
  const navigate = useNavigate();

  const handleCreateTrip = async (values: TripFormValues) => {
    const token = localStorage.getItem("cstp.auth.token");
    if (!token) {
      alert("You must be logged in to create trips.");
      return;
    }

    setAuthToken(token);

    try {
      await apiClient.post("/trips", values);
      alert("Trip created successfully!");
      navigate(ClientRoutes.HOME);
    } catch (err) {
      console.error(err);
      alert("There was a problem creating the trip.");
    }
  };

  return (
    <div>
      <h1>Create Trip</h1>

      <TripFormTemplate onSubmit={handleCreateTrip} submitLabel="Create Trip"/>
    </div>
  );
}
