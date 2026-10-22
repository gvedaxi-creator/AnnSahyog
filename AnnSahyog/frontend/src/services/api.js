const API_BASE_URL = "http://localhost:5000/api";

// Adds the login token (saved with the user at login) to every API call
function authFetch(url, options = {}) {
  let token;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    token = user && user.token ? user.token : null;
  } catch {
    token = null;
  }
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}

export async function getDonations() {
  const response = await authFetch(`${API_BASE_URL}/donations`);

  if (!response.ok) {
    throw new Error("Failed to fetch donations");
  }

  return response.json();
}

export async function createDonation(donation) {
  const response = await authFetch(`${API_BASE_URL}/donations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(donation),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create donation");
  }

  return data;
}

export async function getDonorDonations(donorId) {
  const response = await authFetch(
    `${API_BASE_URL}/donations/donor/${donorId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch donor donations"
    );
  }

  return data;
}


export async function getDonationById(donationId) {
  const response = await authFetch(
    `${API_BASE_URL}/donations/${donationId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch donation"
    );
  }

  return data;
}

export async function getDonorRequests(donorId) {
  const response = await authFetch(
    `${API_BASE_URL}/donation-requests/donor/${donorId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch donation requests"
    );
  }

  return data;
}

export async function respondToDonationRequest(
  requestId,
  donorId,
  status
) {
  const response = await authFetch(
    `${API_BASE_URL}/donation-requests/${requestId}/respond`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        donor_id: donorId,
        status,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to respond to donation request"
    );
  }

  return data;
}

// ======================================================
// DONOR PROFILE
// ======================================================

export async function getDonorProfile(donorId) {
  const response = await authFetch(
    `${API_BASE_URL}/donors/${donorId}/profile`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch donor profile"
    );
  }

  return data;
}

export async function updateDonorProfile(
  donorId,
  profile
) {
  const response = await authFetch(
    `${API_BASE_URL}/donors/${donorId}/profile`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update donor profile"
    );
  }

  return data;
}


// ======================================================
// DONATION HISTORY
// ======================================================

export async function getDonorDonationHistory(
  donorId
) {
  const response = await authFetch(
    `${API_BASE_URL}/donations/donor/${donorId}/history`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to fetch donation history"
    );
  }

  return data;
}


// ======================================================
// PICKUP / DELIVERY
// ======================================================

export async function getDonorPickups(donorId) {
  const response = await authFetch(
    `${API_BASE_URL}/donations/donor/${donorId}/pickups`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to fetch pickup information"
    );
  }

  return data;
}


// ======================================================
// NOTIFICATIONS
// ======================================================

export async function getNotifications(userId) {
  const response = await authFetch(
    `${API_BASE_URL}/notifications/user/${userId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to fetch notifications"
    );
  }

  return data;
}

export async function markNotificationAsRead(
  notificationId,
  userId
) {
  const response = await authFetch(
    `${API_BASE_URL}/notifications/${notificationId}/read`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to mark notification as read"
    );
  }

  return data;
}

export async function getUnreadNotificationCount(
  userId
) {
  const response = await authFetch(
    `${API_BASE_URL}/notifications/user/${userId}/unread-count`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to fetch notification count"
    );
  }

  return data;
}

export async function loginUser(email, password) {
  const response = await authFetch(`${API_BASE_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}



// ======================================================
// ADMIN API FUNCTIONS
// ======================================================

export async function getAdminDashboard() {
  const response = await authFetch(`${API_BASE_URL}/admin/dashboard`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch admin dashboard statistics");
  }
  return data;
}

export async function getAdminUsers() {
  const response = await authFetch(`${API_BASE_URL}/admin/users`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch users");
  }
  return data;
}

export async function updateAdminUserStatus(userId, status) {
  const response = await authFetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update user status");
  }
  return data;
}

export async function getAdminDonations() {
  const response = await authFetch(`${API_BASE_URL}/admin/donations`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch donations");
  }
  return data;
}

export async function getAdminDonationById(donationId) {
  const response = await authFetch(`${API_BASE_URL}/admin/donations/${donationId}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch donation details");
  }
  return data;
}

export async function updateAdminDonationStatus(donationId, status) {
  const response = await authFetch(`${API_BASE_URL}/admin/donations/${donationId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update donation status");
  }
  return data;
}

export async function getAdminNgos() {
  const response = await authFetch(`${API_BASE_URL}/admin/ngos`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch NGOs");
  }
  return data;
}

export async function verifyAdminNgo(ngoId, verificationStatus) {
  const response = await authFetch(`${API_BASE_URL}/admin/ngos/${ngoId}/verify`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ verification_status: verificationStatus }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update NGO verification status");
  }
  return data;
}

export async function getAdminVolunteers() {
  const response = await authFetch(`${API_BASE_URL}/admin/volunteers`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch volunteers");
  }
  return data;
}

export async function getAdminPickups() {
  const response = await authFetch(`${API_BASE_URL}/admin/pickups`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch pickups");
  }
  return data;
}

export async function getAdminPendingPickups() {
  const response = await authFetch(`${API_BASE_URL}/admin/pickups/pending`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch donations awaiting a volunteer");
  }
  return data;
}

export async function assignVolunteerToDonation(donationId, volunteerId) {
  const response = await authFetch(`${API_BASE_URL}/admin/donations/${donationId}/assign-volunteer`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ volunteer_id: volunteerId }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to assign volunteer");
  }
  return data;
}

export async function getAdminFeedback() {
  const response = await authFetch(`${API_BASE_URL}/admin/feedback`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch feedback");
  }
  return data;
}

// ======================================================
// USER REGISTRATION
// ======================================================

export async function registerUser(userData) {
  const response = await authFetch(`${API_BASE_URL}/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
}

// ======================================================
// NGO / RECEIVING ORGANISATION API FUNCTIONS
// ======================================================

export async function getNgoDashboard(ngoId) {
  const response = await authFetch(`${API_BASE_URL}/ngos/${ngoId}/dashboard`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch NGO dashboard");
  }
  return data;
}

export async function getNgoProfile(ngoId) {
  const response = await authFetch(`${API_BASE_URL}/ngos/${ngoId}/profile`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch NGO profile");
  }
  return data;
}

export async function updateNgoProfile(ngoId, profileData) {
  const response = await authFetch(`${API_BASE_URL}/ngos/${ngoId}/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update NGO profile");
  }
  return data;
}

export async function createDonationRequest(requestData) {
  const response = await authFetch(`${API_BASE_URL}/donation-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to submit food request");
  }
  return data;
}

export async function getNgoRequests(ngoId) {
  const response = await authFetch(`${API_BASE_URL}/donation-requests/ngo/${ngoId}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch NGO requests");
  }
  return data;
}

export async function cancelDonationRequest(requestId, ngoId) {
  const response = await authFetch(`${API_BASE_URL}/donation-requests/${requestId}/cancel`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ngo_id: ngoId }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to cancel food request");
  }
  return data;
}

export async function getNgoDeliveries(ngoId) {
  const response = await authFetch(`${API_BASE_URL}/ngos/${ngoId}/deliveries`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch NGO deliveries");
  }
  return data;
}

export async function confirmDeliveryReceipt(pickupId) {
  const response = await authFetch(`${API_BASE_URL}/pickup-delivery/${pickupId}/confirm-receipt`, {
    method: "PUT",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to confirm delivery receipt");
  }
  return data;
}

export async function submitFeedback(feedbackData) {
  const response = await authFetch(`${API_BASE_URL}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(feedbackData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to submit feedback");
  }
  return data;
}

// ======================================================
// VOLUNTEER API FUNCTIONS
// ======================================================

export async function getVolunteerDashboard(volunteerId) {
  const response = await authFetch(`${API_BASE_URL}/volunteers/${volunteerId}/dashboard`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch volunteer dashboard");
  }
  return data;
}

export async function getVolunteerProfile(volunteerId) {
  const response = await authFetch(`${API_BASE_URL}/volunteers/${volunteerId}/profile`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch volunteer profile");
  }
  return data;
}

export async function updateVolunteerProfile(volunteerId, profileData) {
  const response = await authFetch(`${API_BASE_URL}/volunteers/${volunteerId}/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update volunteer profile");
  }
  return data;
}

export async function updateVolunteerAvailability(volunteerId, availability) {
  const response = await authFetch(`${API_BASE_URL}/volunteers/${volunteerId}/availability`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ availability }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update availability");
  }
  return data;
}

export async function getVolunteerTasks(volunteerId) {
  const response = await authFetch(`${API_BASE_URL}/volunteers/${volunteerId}/tasks`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch volunteer tasks");
  }
  return data;
}

export async function getVolunteerTaskById(pickupId) {
  const response = await authFetch(`${API_BASE_URL}/volunteers/tasks/${pickupId}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch task details");
  }
  return data;
}

export async function acceptVolunteerTask(pickupId, volunteerId) {
  const response = await authFetch(`${API_BASE_URL}/volunteers/tasks/${pickupId}/accept`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ volunteer_id: volunteerId }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to accept rescue task");
  }
  return data;
}

export async function updateVolunteerTaskStatus(pickupId, status, notes = "") {
  const response = await authFetch(`${API_BASE_URL}/volunteers/tasks/${pickupId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status, notes }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update delivery status");
  }
  return data;
}

export async function getVolunteerHistory(volunteerId) {
  const response = await authFetch(`${API_BASE_URL}/volunteers/${volunteerId}/history`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch rescue history");
  }
  return data;
}


