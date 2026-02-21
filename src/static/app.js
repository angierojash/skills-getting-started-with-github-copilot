document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  // Escape text to avoid HTML injection
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset activity select
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML
        const participants = Array.isArray(details.participants) ? details.participants : [];
        const participantsHTML = participants.length
          ? `<div class="participants"><strong>Participants:</strong><ul>${participants
              .map(
                (p) =>
                  `<li class="participant-item"><span class="participant-email">${escapeHtml(
                    p
                  )}</span><button class="participant-remove" data-email="${escapeHtml(
                    p
                  )}" data-activity="${escapeHtml(name)}" title="Remove participant">🗑</button></li>`
              )
              .join("")}</ul></div>`
          : `<div class="participants info">No participants have registered yet.</div>`;

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        // Attach delete handlers for participant remove buttons
        activityCard.querySelectorAll('.participant-remove').forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            const email = btn.dataset.email;
            const activityName = btn.dataset.activity;
            if (!confirm(`Remove ${email} from ${activityName}?`)) return;

            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
                { method: 'DELETE' }
              );
              const result = await res.json();
              if (res.ok) {
                // Remove the participant from the DOM
                const li = btn.closest('li');
                if (li) li.remove();

                // If there are no more participant list items, show the empty message
                const participantsDiv = activityCard.querySelector('.participants');
                if (participantsDiv) {
                  const ul = participantsDiv.querySelector('ul');
                  if (!ul || ul.children.length === 0) {
                    participantsDiv.classList.add('info');
                    participantsDiv.innerHTML = 'No participants have registered yet.';
                  }
                }

                // Update availability count (increase by 1)
                const availP = activityCard.querySelector('.availability');
                if (availP) {
                  const match = availP.textContent.match(/(\d+) spots left/);
                  if (match) {
                    const newNum = Math.max(0, parseInt(match[1], 10) + 1);
                    availP.innerHTML = `<strong>Availability:</strong> ${newNum} spots left`;
                  }
                }

                messageDiv.textContent = result.message || 'Participant removed';
                messageDiv.className = 'success';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 5000);
              } else {
                messageDiv.textContent = result.detail || 'Failed to remove participant';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 5000);
              }
            } catch (err) {
              messageDiv.textContent = 'Failed to remove participant';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
              console.error(err);
            }
          });
        });

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities to reflect the new participant immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
