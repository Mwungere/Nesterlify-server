const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
const port = 3000;

// Replace with your actual access token
const DUFFEL_ACCESS_TOKEN = 'duffel_test_p94uLT5WAI3D9qRlbPD30LQ_t0MbGF9XUP6tBqf1Ixl';

// MongoDB setup
mongoose.connect("mongodb://localhost:27017/bookingDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const bookingSchema = new mongoose.Schema({
  fullName: String,
  country: String,
  gender: String,
  dob: String,
  passportNumber: String,
});

const Booking = mongoose.model("Booking", bookingSchema);

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Handle booking submission
app.post("/api/bookings", async (req, res) => {
  const { fullName, country, gender, dob, passportNumber } = req.body;

  try {
    // Create a new booking document
    const newBooking = new Booking({
      fullName,
      country,
      gender,
      dob,
      passportNumber,
    });

    // Save the booking to MongoDB
    const savedBooking = await newBooking.save();

    // Respond with the saved booking data
    res.status(201).json({ booking: savedBooking });

  } catch (error) {
    console.error('Error saving booking:', error);
    res.status(500).json({ error: 'Error saving booking' });
  }
});

// Existing API endpoints for flights
app.post("/api/offer_requests", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.duffel.com/air/offer_requests",
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DUFFEL_ACCESS_TOKEN}`,
          "Duffel-Version": "v1",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    handleError(error, res);
  }
});

app.get("/api/offers/:offer_request_id", async (req, res) => {
  const { offer_request_id } = req.params;
  try {
    const response = await axios.get(
      `https://api.duffel.com/air/offers?offer_request_id=${offer_request_id}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DUFFEL_ACCESS_TOKEN}`,
          "Duffel-Version": "v1",
        },
      }
    );

    if (response.data && response.data.data && response.data.data.length > 0) {
      const offersToDisplay = response.data.data.slice(0, 3);
      res.json({ offers: offersToDisplay });
    } else {
      console.log("No offers found!");
      res.json({ message: "No offers found for your search criteria." });
    }
  } catch (error) {
    handleError(error, res);
  }
});

// New endpoints for stays (accommodation search)
app.post("/api/accommodation_search", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.duffel.com/stays/search",
      req.body,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DUFFEL_ACCESS_TOKEN}`,
          "Duffel-Version": "v1",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    handleError(error, res);
  }
});

// Error handling function
function handleError(error, res) {
  if (error.response) {
    console.error("Error Status:", error.response.status);
    console.error("Error Data:", JSON.stringify(error.response.data, null, 2));
    res.status(error.response.status).json(error.response.data);
  } else {
    console.error("Error Message:", error.message);
    res.status(500).json({ error: error.message });
  }
}

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
});
